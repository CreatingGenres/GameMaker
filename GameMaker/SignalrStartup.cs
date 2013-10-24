using Microsoft.AspNet.SignalR;
using Owin;

namespace GameMaker.WebApp
{
	/// <summary>
	/// Handles starting the SignalR machine properly.
	/// </summary>
	public class SignalrStartup
	{
		public void Configuration(IAppBuilder app)
		{
			// Any connection or hub wire up and configuration should go here
			var config = new HubConfiguration();
			config.EnableJSONP = true;
			config.EnableDetailedErrors = true;
			app.MapSignalR(config);
		}
	}
}