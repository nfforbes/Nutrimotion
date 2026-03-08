using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using NutrimotionApp.Services;
using NutrimotionApp.Views;

namespace NutrimotionApp.ViewModels;

public partial class LoginViewModel : ObservableObject
{
    private readonly AuthService _auth;
    private readonly ApiService _api;

    [ObservableProperty]
    private bool _isBusy;

    [ObservableProperty]
    private string? _errorMessage;

    public LoginViewModel(AuthService auth, ApiService api)
    {
        _auth = auth;
        _api = api;
    }

    [RelayCommand]
    private async Task LoginAsync()
    {
        if (IsBusy) return;

        IsBusy = true;
        ErrorMessage = null;

        try
        {
            var success = await _auth.LoginAsync();
            if (!success)
            {
                ErrorMessage = "Login failed. Please try again.";
                return;
            }

            var userInfo = await _api.GetCurrentUserAsync();
            if (userInfo is null)
            {
                ErrorMessage = "Could not load user information.";
                return;
            }

            Page destination;

            if (userInfo.IsClient && userInfo.IsDriver)
            {
                destination = App.Current!.Handler!.MauiContext!.Services.GetRequiredService<RolePickerPage>();
            }
            else if (userInfo.IsDriver)
            {
                destination = App.Current!.Handler!.MauiContext!.Services.GetRequiredService<DriverShell>();
            }
            else
            {
                destination = App.Current!.Handler!.MauiContext!.Services.GetRequiredService<ClientShell>();
            }

            if (Application.Current?.Windows.FirstOrDefault() is Window window)
            {
                window.Page = destination is Shell shell ? shell : new NavigationPage(destination);
            }
        }
        catch (Exception ex)
        {
            ErrorMessage = $"An error occurred: {ex.Message}";
        }
        finally
        {
            IsBusy = false;
        }
    }
}
