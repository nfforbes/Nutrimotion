using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using NutrimotionApp.Models;
using NutrimotionApp.Services;
using System.Collections.ObjectModel;

namespace NutrimotionApp.ViewModels;

public partial class DriverDashboardViewModel : ObservableObject
{
    private readonly ApiService _api;

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private int _activeCount;

    public ObservableCollection<Assignment> Assignments { get; } = [];

    public DriverDashboardViewModel(ApiService api)
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

            ActiveCount = items.Count;
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
}
