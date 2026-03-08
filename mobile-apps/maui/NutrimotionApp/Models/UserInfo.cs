using System.Text.Json.Serialization;

namespace NutrimotionApp.Models;

public class UserInfo
{
    [JsonPropertyName("user")]
    public UserData? User { get; set; }

    [JsonPropertyName("roles")]
    public List<string> Roles { get; set; } = [];

    [JsonPropertyName("permissions")]
    public List<string> Permissions { get; set; } = [];

    public bool IsClient => Roles.Contains("client");
    public bool IsDriver => Roles.Contains("driver");
    public bool IsAdmin => Roles.Contains("administrator");
    public bool HasMultipleRoles => (IsClient ? 1 : 0) + (IsDriver ? 1 : 0) > 1;
}

public class UserData
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("picture")]
    public string? Picture { get; set; }
}
