using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using NutrimotionApp.Views;

namespace NutrimotionApp.ViewModels;

public partial class RolePickerViewModel : ObservableObject
{
    [RelayCommand]
    private void ContinueAsClient()
    {
        var shell = App.Current!.Handler!.MauiContext!.Services.GetRequiredService<ClientShell>();
        if (Application.Current?.Windows.FirstOrDefault() is Window window)
            window.Page = shell;
    }

    [RelayCommand]
    private void ContinueAsDriver()
    {
        var shell = App.Current!.Handler!.MauiContext!.Services.GetRequiredService<DriverShell>();
        if (Application.Current?.Windows.FirstOrDefault() is Window window)
            window.Page = shell;
    }
}
