using CommunityToolkit.Mvvm.Input;
using Nutrimotion.Models;

namespace Nutrimotion.PageModels
{
    public interface IProjectTaskPageModel
    {
        IAsyncRelayCommand<ProjectTask> NavigateToTaskCommand { get; }
        bool IsBusy { get; }
    }
}