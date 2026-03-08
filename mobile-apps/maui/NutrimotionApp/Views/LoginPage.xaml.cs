using NutrimotionApp.ViewModels;

namespace NutrimotionApp.Views;

public partial class LoginPage : ContentPage
{
    public LoginPage(LoginViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }

    public LoginPage()
    {
        InitializeComponent();
    }
}
