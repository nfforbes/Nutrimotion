using Auth0.OidcClient;

namespace NutrimotionApp.Services;

public class AuthService
{
    private readonly Auth0Client _auth0;
    private const string AccessTokenKey = "access_token";
    private const string IdTokenKey = "id_token";

    public AuthService(Auth0Client auth0)
    {
        _auth0 = auth0;
    }

    public async Task<bool> LoginAsync()
    {
        var result = await _auth0.LoginAsync();

        if (result.IsError)
            return false;

        if (!string.IsNullOrEmpty(result.AccessToken))
            await SecureStorage.SetAsync(AccessTokenKey, result.AccessToken);

        if (!string.IsNullOrEmpty(result.IdentityToken))
            await SecureStorage.SetAsync(IdTokenKey, result.IdentityToken);

        return true;
    }

    public async Task LogoutAsync()
    {
        await _auth0.LogoutAsync();
        SecureStorage.Remove(AccessTokenKey);
        SecureStorage.Remove(IdTokenKey);
    }

    public async Task<string?> GetAccessTokenAsync()
    {
        return await SecureStorage.GetAsync(AccessTokenKey);
    }

    public async Task<bool> IsAuthenticatedAsync()
    {
        var token = await SecureStorage.GetAsync(AccessTokenKey);
        return !string.IsNullOrEmpty(token);
    }
}
