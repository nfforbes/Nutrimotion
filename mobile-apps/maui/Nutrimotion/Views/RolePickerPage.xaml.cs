using NutrimotionApp.ViewModels;

namespace NutrimotionApp.Views;

public partial class RolePickerPage : ContentPage
{
    public RolePickerPage(RolePickerViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
