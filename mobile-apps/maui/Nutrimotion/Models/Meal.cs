using System.Text.Json.Serialization;

namespace NutrimotionApp.Models;

public class Meal
{
    [JsonPropertyName("_id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("imageUrl")]
    public string? ImageUrl { get; set; }

    [JsonPropertyName("price")]
    public decimal Price { get; set; }

    [JsonPropertyName("slot")]
    public string Slot { get; set; } = string.Empty;

    [JsonPropertyName("scheduledDate")]
    public DateTime ScheduledDate { get; set; }

    [JsonPropertyName("available")]
    public bool Available { get; set; }

    public string SlotDisplay => Slot switch
    {
        "breakfast" => "Breakfast",
        "lunch" => "Lunch",
        "dinner" => "Dinner",
        _ => Slot
    };
}

public class MealPackage
{
    [JsonPropertyName("_id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("breakfastCount")]
    public int BreakfastCount { get; set; }

    [JsonPropertyName("lunchCount")]
    public int LunchCount { get; set; }

    [JsonPropertyName("dinnerCount")]
    public int DinnerCount { get; set; }

    [JsonPropertyName("cost")]
    public decimal Cost { get; set; }

    [JsonPropertyName("daysOption")]
    public string DaysOption { get; set; } = "any";

    [JsonPropertyName("specificDays")]
    public List<int> SpecificDays { get; set; } = [];

    public string MealSummary =>
        $"{BreakfastCount} Breakfasts · {LunchCount} Lunches · {DinnerCount} Dinners";

    public string CostDisplay => Cost.ToString("C2");
}
