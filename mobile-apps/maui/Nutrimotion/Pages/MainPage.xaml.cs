using Nutrimotion.Models;
using Nutrimotion.PageModels;

namespace Nutrimotion.Pages
{
    public partial class MainPage : ContentPage
    {
        public MainPage(MainPageModel model)
        {
            InitializeComponent();
            BindingContext = model;
        }
    }
}