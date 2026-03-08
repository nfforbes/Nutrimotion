using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using NutrimotionApp.Models;
using NutrimotionApp.Services;
using System.Collections.ObjectModel;

namespace NutrimotionApp.ViewModels;

public partial class ClientDashboardViewModel : ObservableObject
{
    private readonly ApiService _api;

    [ObservableProperty]
    private bool _isLoading;

    public ObservableCollection<MealPackage> Packages { get; } = [];
    public ObservableCollection<Meal> Meals { get; } = [];

    public ClientDashboardViewModel(ApiService api)
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
            var packagesTask = _api.GetPackagesAsync();
            var mealsTask = _api.GetMealsAsync();

            await Task.WhenAll(packagesTask, mealsTask);

            Packages.Clear();
            foreach (var pkg in await packagesTask)
                Packages.Add(pkg);

            Meals.Clear();
            foreach (var meal in await mealsTask)
                Meals.Add(meal);
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
