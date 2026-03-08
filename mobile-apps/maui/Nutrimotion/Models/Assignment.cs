using System.Text.Json.Serialization;

namespace NutrimotionApp.Models;

public class Assignment
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("orderId")]
    public string OrderId { get; set; } = string.Empty;

    [JsonPropertyName("orderNumber")]
    public string? OrderNumber { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("customerName")]
    public string CustomerName { get; set; } = string.Empty;

    [JsonPropertyName("customerPhone")]
    public string? CustomerPhone { get; set; }

    [JsonPropertyName("customerAddress")]
    public Address? CustomerAddress { get; set; }

    [JsonPropertyName("assignedAt")]
    public DateTime? AssignedAt { get; set; }

    public string StatusDisplay => Status switch
    {
        "preparing" => "Preparing",
        "out_for_delivery" => "Out for Delivery",
        "delivered" => "Delivered",
        _ => Status
    };

    public string AddressDisplay => CustomerAddress is not null
        ? $"{CustomerAddress.Street}, {CustomerAddress.City}, {CustomerAddress.State} {CustomerAddress.ZipCode}"
        : "No address";
}

public class Address
{
    [JsonPropertyName("street")]
    public string Street { get; set; } = string.Empty;

    [JsonPropertyName("city")]
    public string City { get; set; } = string.Empty;

    [JsonPropertyName("state")]
    public string State { get; set; } = string.Empty;

    [JsonPropertyName("zipCode")]
    public string ZipCode { get; set; } = string.Empty;

    [JsonPropertyName("country")]
    public string Country { get; set; } = string.Empty;
}
