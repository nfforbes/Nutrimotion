using NutrimotionApp.ViewModels;

namespace NutrimotionApp.Views;

public partial class DriverAssignmentsPage : ContentPage
{
    private readonly DriverAssignmentsViewModel _vm;

    public DriverAssignmentsPage(DriverAssignmentsViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = _vm = viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _vm.LoadDataCommand.ExecuteAsync(null);
    }
}
