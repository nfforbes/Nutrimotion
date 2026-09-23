/**
 * GET /api/admin/analytics — KPI cards, trends, and breakdowns for admin analytics.
 *
 * Query: days=7|30|90 (default 30)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';
import { DeliveryAssignment, Order, User } from '@/lib/db/models';
import { OrderStatus } from '@/types/commerce';
import {
  REVENUE_STATUSES,
  addDays,
  buildDateRange,
  fillSeries,
  forecastFromSeries,
  percentChange,
  startOfDay,
  toDateKey,
} from '@/lib/analytics/buildAnalytics';

const ALLOWED_DAYS = new Set([7, 30, 90]);

export async function GET(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.VIEW_ANALYTICS]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const daysRaw = Number(searchParams.get('days') || 30);
    const days = ALLOWED_DAYS.has(daysRaw) ? daysRaw : 30;

    const rangeEnd = startOfDay(new Date());
    const rangeStart = addDays(rangeEnd, -(days - 1));
    const prevEnd = addDays(rangeStart, -1);
    const prevStart = addDays(prevEnd, -(days - 1));
    const dateKeys = buildDateRange(days, rangeEnd);

    const rangeFilter = { createdAt: { $gte: rangeStart, $lte: addDays(rangeEnd, 1) } };
    const prevFilter = { createdAt: { $gte: prevStart, $lte: addDays(prevEnd, 1) } };

    const [
      revenueAgg,
      prevRevenueAgg,
      orderCount,
      prevOrderCount,
      ordersByDay,
      ordersByStatus,
      completedDeliveries,
      prevCompletedDeliveries,
      totalUsers,
      usersInRange,
      prevUsersInRange,
      usersByDay,
      topItems,
      topCustomers,
      deliveryPerf,
      parishBreakdown,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { ...rangeFilter, status: { $in: REVENUE_STATUSES } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { ...prevFilter, status: { $in: REVENUE_STATUSES } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      Order.countDocuments(rangeFilter),
      Order.countDocuments(prevFilter),
      Order.aggregate([
        { $match: rangeFilter },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            orders: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [
                  { $in: ['$status', REVENUE_STATUSES] },
                  '$total',
                  0,
                ],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: rangeFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Order.countDocuments({
        ...rangeFilter,
        status: OrderStatus.DELIVERED,
      }),
      Order.countDocuments({
        ...prevFilter,
        status: OrderStatus.DELIVERED,
      }),
      User.countDocuments({}),
      User.countDocuments(rangeFilter),
      User.countDocuments(prevFilter),
      User.aggregate([
        { $match: rangeFilter },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: { ...rangeFilter, status: { $in: REVENUE_STATUSES } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: {
              name: '$items.name',
              itemType: '$items.itemType',
            },
            quantity: { $sum: '$items.quantity' },
            revenue: {
              $sum: { $multiply: ['$items.price', '$items.quantity'] },
            },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 10 },
      ]),
      Order.aggregate([
        { $match: { ...rangeFilter, status: { $in: REVENUE_STATUSES } } },
        {
          $group: {
            _id: '$userId',
            orders: { $sum: 1 },
            spend: { $sum: '$total' },
          },
        },
        { $sort: { spend: -1 } },
        { $limit: 8 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            name: { $ifNull: ['$user.name', 'Unknown'] },
            email: { $ifNull: ['$user.email', ''] },
            orders: 1,
            spend: 1,
          },
        },
      ]),
      DeliveryAssignment.aggregate([
        {
          $match: {
            assignedAt: { $gte: rangeStart, $lte: addDays(rangeEnd, 1) },
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgMinutes: {
              $avg: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$deliveredAt', null] },
                      { $ne: ['$assignedAt', null] },
                    ],
                  },
                  {
                    $divide: [
                      { $subtract: ['$deliveredAt', '$assignedAt'] },
                      60000,
                    ],
                  },
                  null,
                ],
              },
            },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            ...rangeFilter,
            status: { $in: REVENUE_STATUSES },
            'deliveryAddress.parish': { $exists: true, $ne: '' },
          },
        },
        {
          $group: {
            _id: '$deliveryAddress.parish',
            orders: { $sum: 1 },
            revenue: { $sum: '$total' },
          },
        },
        { $sort: { orders: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const revenue = revenueAgg[0]?.total ?? 0;
    const prevRevenue = prevRevenueAgg[0]?.total ?? 0;

    const revenueMap = new Map<string, number>();
    const orderMap = new Map<string, number>();
    for (const row of ordersByDay) {
      revenueMap.set(row._id, row.revenue ?? 0);
      orderMap.set(row._id, row.orders ?? 0);
    }
    const userMap = new Map<string, number>();
    for (const row of usersByDay) {
      userMap.set(row._id, row.count ?? 0);
    }

    const revenueTrend = fillSeries(dateKeys, revenueMap);
    const orderTrend = fillSeries(dateKeys, orderMap);
    const userGrowth = fillSeries(dateKeys, userMap);

    const statusCounts: Record<string, number> = {};
    for (const row of ordersByStatus) {
      statusCounts[row._id] = row.count;
    }

    let deliveryTotal = 0;
    let deliveryCompleted = 0;
    let avgDeliveryMinutes: number | null = null;
    const deliveryByStatus: { status: string; count: number }[] = [];
    for (const row of deliveryPerf) {
      deliveryTotal += row.count;
      deliveryByStatus.push({ status: row._id, count: row.count });
      if (row._id === OrderStatus.DELIVERED) {
        deliveryCompleted = row.count;
        if (typeof row.avgMinutes === 'number' && !Number.isNaN(row.avgMinutes)) {
          avgDeliveryMinutes = Math.round(row.avgMinutes);
        }
      }
    }

    const returningCustomers = await Order.aggregate([
      { $match: { ...rangeFilter, status: { $in: REVENUE_STATUSES } } },
      { $group: { _id: '$userId', orders: { $sum: 1 } } },
      {
        $group: {
          _id: null,
          uniqueCustomers: { $sum: 1 },
          returning: {
            $sum: { $cond: [{ $gt: ['$orders', 1] }, 1, 0] },
          },
        },
      },
    ]);

    const uniqueCustomers = returningCustomers[0]?.uniqueCustomers ?? 0;
    const returning = returningCustomers[0]?.returning ?? 0;

    return NextResponse.json({
      range: {
        days,
        start: toDateKey(rangeStart),
        end: toDateKey(rangeEnd),
      },
      kpis: {
        revenue: {
          value: revenue,
          previous: prevRevenue,
          changePercent: percentChange(revenue, prevRevenue),
        },
        orders: {
          value: orderCount,
          previous: prevOrderCount,
          changePercent: percentChange(orderCount, prevOrderCount),
        },
        users: {
          value: totalUsers,
          newInPeriod: usersInRange,
          previousNew: prevUsersInRange,
          changePercent: percentChange(usersInRange, prevUsersInRange),
        },
        deliveries: {
          value: completedDeliveries,
          previous: prevCompletedDeliveries,
          changePercent: percentChange(completedDeliveries, prevCompletedDeliveries),
        },
      },
      trends: {
        revenue: revenueTrend,
        orders: orderTrend,
        users: userGrowth,
        revenueForecast: forecastFromSeries(revenueTrend, 7),
        orderForecast: forecastFromSeries(orderTrend, 7),
      },
      orderStatus: Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      })),
      popularItems: topItems.map((row) => ({
        name: row._id.name,
        itemType: row._id.itemType,
        quantity: row.quantity,
        revenue: row.revenue,
      })),
      topCustomers,
      delivery: {
        total: deliveryTotal,
        completed: deliveryCompleted,
        completionRate:
          deliveryTotal > 0
            ? Math.round((deliveryCompleted / deliveryTotal) * 1000) / 10
            : null,
        avgMinutes: avgDeliveryMinutes,
        byStatus: deliveryByStatus,
      },
      customers: {
        unique: uniqueCustomers,
        returning,
        retentionRate:
          uniqueCustomers > 0
            ? Math.round((returning / uniqueCustomers) * 1000) / 10
            : null,
      },
      byParish: parishBreakdown.map((row) => ({
        parish: row._id || 'Unknown',
        orders: row.orders,
        revenue: row.revenue,
      })),
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}
