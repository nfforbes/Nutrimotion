using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using NutrimotionApp.Models;
using NutrimotionApp.Services;
using System.Collections.ObjectModel;

namespace NutrimotionApp.ViewModels;

public partial class DriverAssignmentsViewModel : ObservableObject
{
    private readonly ApiService _api;

    [ObservableProperty]
    private bool _isLoading;

    public ObservableCollection<Assignment> Assignments { get; } = [];

    public DriverAssignmentsViewModel(ApiService api)
    {
        _api = api;
    }

    [RelayCommand]
    private async Task LoadDataAsync()
    {
        if (IsLoading) return;
        IsLoading = true;

        try
        {
            var items = await _api.GetAssignmentsAsync();
            Assignments.Clear();
            foreach (var a in items)
                Assignments.Add(a);
        }
        catch
        {
            // Silently handle for now
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task StartDeliveryAsync(Assignment assignment)
    {
        var ok = await _api.UpdateAssignmentStatusAsync(assignment.Id, "out_for_delivery");
        if (ok) await LoadDataAsync();
    }

    [RelayCommand]
    private async Task MarkDeliveredAsync(Assignment assignment)
    {
        var ok = await _api.UpdateAssignmentStatusAsync(assignment.Id, "delivered");
        if (ok) await LoadDataAsync();
    }
}
