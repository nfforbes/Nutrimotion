using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.Maui.ApplicationModel;
using NutrimotionApp.Models;
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

    /// <summary>
    /// Called when LoginPage appears. If user is already authenticated, navigate to dashboard.
    /// </summary>
    public async Task TryRestoreSessionAsync()
    {
        if (!await _auth.IsAuthenticatedAsync())
            return;

        if (IsBusy) return;
        IsBusy = true;
        ErrorMessage = null;

        try
        {
            var (userInfo, _) = await _api.GetCurrentUserAsync();
            if (userInfo is null)
            {
                await _auth.LogoutAsync();
                return;
            }

            NavigateToDashboard(userInfo);
        }
        catch
        {
            await _auth.LogoutAsync();
        }
        finally
        {
            IsBusy = false;
        }
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

            var (userInfo, apiError) = await _api.GetCurrentUserAsync();
            if (userInfo is null)
            {
                ErrorMessage = apiError ?? "Could not load user information.";
                return;
            }

            NavigateToDashboard(userInfo);
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

    private static void NavigateToDashboard(UserInfo userInfo)
    {
        MainThread.BeginInvokeOnMainThread(() =>
        {
            try
            {
                var services = Application.Current?.Handler?.MauiContext?.Services;
                if (services is null)
                    return;

                Page destination = userInfo.IsClient && userInfo.IsDriver
                    ? services.GetRequiredService<RolePickerPage>()
                    : userInfo.IsDriver
                        ? services.GetRequiredService<DriverShell>()
                        : services.GetRequiredService<ClientShell>();

                if (Application.Current?.Windows.FirstOrDefault() is Window window)
                    window.Page = destination is Shell shell ? shell : new NavigationPage(destination);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"NavigateToDashboard failed: {ex}");
            }
        });
    }
}
