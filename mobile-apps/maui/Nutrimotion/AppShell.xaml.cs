using CommunityToolkit.Maui.Alerts;
using CommunityToolkit.Maui.Core;
using NutrimotionApp.Views;

namespace NutrimotionApp;

public partial class AppShell : Shell
{
    public AppShell(IServiceProvider services)
    {
        InitializeComponent();
        LoginContent.Content = services.GetRequiredService<LoginPage>();
    }

    public static async Task DisplayToastAsync(string message)
    {
        if (string.IsNullOrWhiteSpace(message))
            return;

        try
        {
            var toast = Toast.Make(message, ToastDuration.Short);
            await toast.Show();
        }
        catch
        {
            // Intentionally ignore failures to show toast.
        }
    }
}
