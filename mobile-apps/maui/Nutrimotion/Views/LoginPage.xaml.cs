using NutrimotionApp.ViewModels;

namespace NutrimotionApp.Views;

public partial class LoginPage : ContentPage
{
    private readonly LoginViewModel? _viewModel;

    public LoginPage(LoginViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = _viewModel = viewModel;
    }

    public LoginPage()
    {
        InitializeComponent();
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        if (_viewModel is not null)
            await _viewModel.TryRestoreSessionAsync();
    }
}
