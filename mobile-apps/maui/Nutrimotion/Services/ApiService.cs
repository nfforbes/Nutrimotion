using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using NutrimotionApp.Models;

namespace NutrimotionApp.Services;

public class ApiService
{
    private readonly HttpClient _http;
    private readonly AuthService _auth;

    public ApiService(AuthService auth)
    {
        _auth = auth;
        _http = new HttpClient
        {
            BaseAddress = new Uri(Constants.ApiBaseUrl)
        };
    }

    private async Task SetAuthHeaderAsync()
    {
        var token = await _auth.GetAccessTokenAsync();
        if (!string.IsNullOrEmpty(token))
            _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    private async Task SetAuthHeaderForMeAsync()
    {
        // Use ID token for /api/auth/me - backend validates JWT; Access Token may be opaque
        var token = await _auth.GetTokenForApiAuthAsync();
        if (!string.IsNullOrEmpty(token))
            _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    // ── Auth ──

    public async Task<(UserInfo? User, string? Error)> GetCurrentUserAsync()
    {
        await SetAuthHeaderForMeAsync();
        try
        {
            var response = await _http.GetAsync("/api/auth/me");
            if (!response.IsSuccessStatusCode)
            {
                var status = (int)response.StatusCode;
                return (null, status == 401
                    ? "Session invalid. Please try logging in again."
                    : $"Server error ({status}). Ensure the API is running at {Constants.ApiBaseUrl}");
            }
            var user = await response.Content.ReadFromJsonAsync<UserInfo>();
            return (user, null);
        }
        catch (HttpRequestException)
        {
            return (null, $"Cannot reach API at {Constants.ApiBaseUrl}. Is the server running? On Android emulator use 10.0.2.2:3000.");
        }
    }

    // ── Client: Meals ──

    public async Task<List<Meal>> GetMealsAsync()
    {
        await SetAuthHeaderAsync();
        var response = await _http.GetAsync("/api/meals");
        if (!response.IsSuccessStatusCode) return [];
        return await response.Content.ReadFromJsonAsync<List<Meal>>() ?? [];
    }

    public async Task<List<MealPackage>> GetPackagesAsync()
    {
        await SetAuthHeaderAsync();
        var response = await _http.GetAsync("/api/packages");
        if (!response.IsSuccessStatusCode) return [];
        return await response.Content.ReadFromJsonAsync<List<MealPackage>>() ?? [];
    }

    // ── Driver ──

    public async Task<List<Assignment>> GetAssignmentsAsync()
    {
        await SetAuthHeaderAsync();
        var response = await _http.GetAsync("/api/driver/assignments");
        if (!response.IsSuccessStatusCode) return [];
        return await response.Content.ReadFromJsonAsync<List<Assignment>>() ?? [];
    }

    public async Task<bool> UpdateAssignmentStatusAsync(string assignmentId, string status)
    {
        await SetAuthHeaderAsync();
        var content = new StringContent(
            JsonSerializer.Serialize(new { status }),
            Encoding.UTF8,
            "application/json");

        var response = await _http.PatchAsync($"/api/driver/assignments/{assignmentId}", content);
        return response.IsSuccessStatusCode;
    }

    public async Task<bool> UpdateLocationAsync(double latitude, double longitude)
    {
        await SetAuthHeaderAsync();
        var content = new StringContent(
            JsonSerializer.Serialize(new { latitude, longitude }),
            Encoding.UTF8,
            "application/json");

        var response = await _http.PostAsync("/api/driver/location", content);
        return response.IsSuccessStatusCode;
    }
}
