using NutrimotionApp.ViewModels;

namespace NutrimotionApp.Views;

public partial class DriverDashboardPage : ContentPage
{
    private readonly DriverDashboardViewModel _vm;

    public DriverDashboardPage(DriverDashboardViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = _vm = viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _vm.LoadDataCommand.ExecuteAsync(null);
    }
}
