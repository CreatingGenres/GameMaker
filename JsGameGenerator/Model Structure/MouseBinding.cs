using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Xml.Serialization;
using Newtonsoft.Json;

namespace GameMaker
{
	//REVIEW: Generate an interface for this. ICGGameMakerCGBindingCGInterfaceForCGBindings
	public class MouseBinding : ICodeGenerator
	{
		/// <summary>
		/// Gets or sets the code of the button that activates this binding. 
		/// </summary>
		[XmlAttribute("button")]
		[JsonProperty("button", DefaultValueHandling=DefaultValueHandling.Include)]
		public string Button { get; set; }

		/// <summary>
		/// Gets or sets the unit whose method should be called when the button is pressed.
		/// </summary>
		[XmlAttribute("target")]
		[JsonProperty("target", DefaultValueHandling=DefaultValueHandling.Include)]
		public string Target { get; set; }

		/// <summary>
		/// Gets or sets the method to be called on the target.
		/// </summary>
		[XmlAttribute("action")]
		[JsonProperty("action", DefaultValueHandling=DefaultValueHandling.Include)]
		public string Action { get; set; }

		/// <summary>
		/// Gets or sets the arguments to be provided to the <see cref="KeyBinding.Action"/>.
		/// </summary>
		[XmlArray("args")]
		[XmlArrayItem("argument")]
		[JsonProperty("args", DefaultValueHandling = DefaultValueHandling.Include)]
		public List<ModuleArgument> Args { get; set; }

		/// <summary>
		/// Gets or sets a value indicating whether the <see cref="KeyBinding.Action"/> should be called once when the button is
		/// pressed.
		/// </summary>
		[XmlAttribute("single-call")]
		[JsonProperty("single-call", DefaultValueHandling=DefaultValueHandling.Include)]
		public bool SingleCall { get; set; }

		/// <summary>
		/// Generates the code for this keybinding.
		/// </summary>
		public string GenerateCode()
		{
			//Call methods of presetModules here
			string condition = string.Format("mouse['{0}']", Button);
			if (SingleCall)
			{
				condition += string.Format(" && !previousMouse['{0}']", Button);
			}

			return string.Format(
				@"
					if ({0}) {{
						var selected = selector('{1}');
						for (var i in selected) {{
							selected[i].{2}({3});
						}}
					}}
				", condition, Target, Action, FormatParams(Args));
		}

		private string FormatParams(IEnumerable<ModuleArgument> args)
		{
			if (args == null || args.FirstOrDefault() == null)
				return string.Empty;

			StringBuilder builder = new StringBuilder();
			builder.Append("new Object({");
			foreach (var arg in args)
			{
				builder.AppendFormat(@"{0}: {1}, ", arg.Name, arg.Value);
			}
			builder.Append("})");
			return builder.ToString();
		}
	}
}
