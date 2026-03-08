using Auth0.OidcClient;
using Microsoft.Extensions.Logging;
using NutrimotionApp.Services;
using NutrimotionApp.ViewModels;
using NutrimotionApp.Views;
using CommunityToolkit.Maui;

namespace NutrimotionApp;
public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder.UseMauiApp<App>().ConfigureFonts(fonts =>
        {
            fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
            fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
        }).UseMauiCommunityToolkit();
        // Auth0
        builder.Services.AddSingleton(new Auth0Client(new Auth0ClientOptions { Domain = Constants.Auth0Domain, ClientId = Constants.Auth0ClientId, RedirectUri = $"{Constants.Auth0Scheme}://callback", PostLogoutRedirectUri = $"{Constants.Auth0Scheme}://callback", Scope = "openid profile email offline_access", }));
        // Services
        builder.Services.AddSingleton<AuthService>();
        builder.Services.AddSingleton<ApiService>();
        // ViewModels
        builder.Services.AddTransient<LoginViewModel>();
        builder.Services.AddTransient<RolePickerViewModel>();
        builder.Services.AddTransient<ClientDashboardViewModel>();
        builder.Services.AddTransient<DriverDashboardViewModel>();
        builder.Services.AddTransient<DriverAssignmentsViewModel>();
        // Pages
        builder.Services.AddTransient<AppShell>();
        builder.Services.AddTransient<LoginPage>();
        builder.Services.AddTransient<RolePickerPage>();
        builder.Services.AddTransient<ClientShell>();
        builder.Services.AddTransient<ClientDashboardPage>();
        builder.Services.AddTransient<DriverShell>();
        builder.Services.AddTransient<DriverDashboardPage>();
        builder.Services.AddTransient<DriverAssignmentsPage>();
#if DEBUG
        builder.Logging.AddDebug();
#endif
        return builder.Build();
    }
}