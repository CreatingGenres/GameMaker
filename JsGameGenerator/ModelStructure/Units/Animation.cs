using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Xml.Serialization;
using Newtonsoft.Json;

namespace GameMaker.ModelStructure.Units
{
	public class Animation
	{
		[XmlAttribute("name")]
		[JsonProperty("name")]
		public string Name { get; set; }

		[XmlAttribute("row")]
		[JsonProperty("row")]
		public int RowIndex { get; set; }

		[XmlAttribute("startCol")]
		[JsonProperty("startCol")]
		public int StartColumn { get; set; }

		[XmlAttribute("endCol")]
		[JsonProperty("endCol")]
		public int EndColumn { get; set; }

		[XmlAttribute("duration")]
		[JsonProperty("duration")]
		public int Duration { get; set; }

		[XmlAttribute("mustPlayUntilFinished")]
		[JsonProperty("mustPlayUntilFinished")]
		public bool MustPlayUntilFinished { get; set; }

		[XmlArray("playedOn")]
		[XmlArrayItem("action")]
		[JsonProperty("playedOn")]
		public List<UnitAction> PlayedOn { get; set; }

		[XmlAttribute("isEmpty")]
		[JsonProperty("isEmpty")]
		public bool IsEmpty { get; set; }
	}

	//REVIEW: Why dafuq is this here?
	public class UnitAction
	{
		[XmlAttribute("name")]
		[JsonProperty("name")]
		public string Name { get; set; }

		[XmlAttribute("args")]
		[JsonProperty("args")]
		public string Args { get; set; }

		public string FormatArgs()
		{
			var builder = new StringBuilder();
			builder.Append("var actionArgs = {");
			
			if (!string.IsNullOrEmpty(this.Args))
			{
				builder.Append(this.Args);
			}
			builder.Append("};");
			return builder.ToString();
		}
	}

	[XmlRoot("animations")]
	public class AnimationCollection : List<Animation>
	{
		public string GenerateCode(string unitId, int framesPerRow)
		{
			//REVIEW: Maybe we should return errors like this to the user?
			if (!this.Any((animation) => animation.Name == "idle"))
				throw new InvalidOperationException("No idle animation is present!");

			var builder = new StringBuilder();

			builder.Append("(function() {\n var animations = []; ");
			foreach (var animation in this)
			{
				if (animation.EndColumn == 0)
					animation.EndColumn = framesPerRow;
				if (!animation.IsEmpty)
					builder.AppendFormat("animations['{0}'] = new Animation({1}, {2}, {3}, {4}, {5}, {6});\n", 
						animation.Name, animation.RowIndex, framesPerRow, animation.StartColumn, animation.EndColumn, animation.Duration, animation.MustPlayUntilFinished.ToString().ToLowerInvariant());
				else
					builder.AppendFormat("animations['{0}'] = new Animation({1}, {2}, {3}, {4}, Number.MAX_VALUE, false);\n",
						animation.Name, animation.RowIndex, framesPerRow, animation.StartColumn, framesPerRow);

				foreach (var action in animation.PlayedOn)
				{
					builder.AppendFormat(
					@"unitModulesEvents['{0}'].push(function(args) {{
						if (!this.id.startsWith('{1}'))
							return;
						{2}
						if (Helper.hasProperties(actionArgs)) {{
							for (var i in args) {{
								if (actionArgs[i] != 'undefined' && eval(args[i]) != eval(actionArgs[i]))
									return; 
							}}
						}}
						if (this.animations['{3}'])
							this.activeAnimation = '{3}'; }});", action.Name, unitId, action.FormatArgs(), animation.Name);
				}
			}
			builder.Append("return animations;})()");

			return builder.ToString();
		}
	}
}
