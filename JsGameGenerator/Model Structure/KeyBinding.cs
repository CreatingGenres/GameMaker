using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Xml.Serialization;
using Newtonsoft.Json;

namespace GameMaker
{
	/// <summary>
	/// Represents a single key binding. Use the <see cref="KeyBinding.Target"/> property to specify the unit and
	/// <see cref="KeyBinding.Action"/> to set method to be called.
	/// </summary>
	[XmlType("keyBinding")]
	public class KeyBinding : ICodeGenerator
	{
		/// <summary>
		/// Gets or sets the code of the key that activates this binding. 
		/// </summary>
		[XmlAttribute("key")]
		[JsonProperty("key", DefaultValueHandling=DefaultValueHandling.Include)]
		public string Key { get; set; }

		/// <summary>
		/// Gets or sets the unit whose method should be called when the key is pressed.
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
		[JsonProperty("args", DefaultValueHandling=DefaultValueHandling.Include)]
		public List<ModuleArgument> Args { get; set; }

		/// <summary>
		/// Gets or sets a value indicating whether the <see cref="KeyBinding.Action"/> should be called once when the key is
		/// pressed.
		/// </summary>
		[XmlAttribute("single-call")]
		[JsonProperty("singleCall", Required=Required.Default)]
		public bool SingleCall { get; set; }

        /// <summary>
        /// Traiko's hugly &amp; enourmously stupid code piece
        /// </summary>
        private static string GameAsTarget = "#None";

		/// <summary>
		/// Generates the code for this keybinding.
		/// </summary>
		public string GenerateCode()
		{
			//Call methods of modules here
			string condition = string.Format("keyboard[{0}]", this.Key);
			if (this.SingleCall)
			{
				condition += string.Format(" && !previousKeyboard[{0}]", this.Key);
			}

            // The target is the game itself => call a game module.
            if (this.Target == GameAsTarget)
            {
                return string.Format(
				   @"
					if ({0}) {{
						var module = modules['{1}'];
						if (module.invoke) {{
							try {{
								module.invoke({2});
							}}
							catch(error) {{ 
								logger.onError('Error on keybinding call. Key: {0}, Target: Game, Module: {1}', error);}}
						}}
					}}
				", condition, this.Action, this.Args.FormatParams());
            }

            // A unit module is to be called
			return string.Format(
				@"
				if ({0}) {{
					var selected = selector('{1}');
					for (var i in selected) {{
						try {{
							selected[i].{2}({3});
						}}
						catch(error) {{ 
							logger.onError('Error on keybinding call. Key: {0}, Target: {1}, Action: {2}', error);
						}}
					}}
				}}
				", condition, this.Target, this.Action, this.Args.FormatParams());
		}
	}

}
