using NutrimotionApp.ViewModels;

namespace NutrimotionApp.Views;

public partial class ClientDashboardPage : ContentPage
{
    private readonly ClientDashboardViewModel _vm;

    public ClientDashboardPage(ClientDashboardViewModel viewModel)
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
