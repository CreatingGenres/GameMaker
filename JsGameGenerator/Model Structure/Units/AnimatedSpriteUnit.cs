using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Serialization;
using Newtonsoft.Json;

namespace GameMaker.Model_Structure.Units
{
	//REVIEW: No documentation? Dafuq?
	//REVIEW: Create an interface for things that generate code. I recommend ICGWebUnitThatGeneratesCGGameMakerCode
	public class AnimatedSpriteUnit : Unit
	{
        [EditorField(EditorField.EditorType.Picture)]
		[XmlAttribute("texture")]
		[JsonProperty("texture")]
		public string Texture { get; set; }

		//REVIEW: Perhaps the animations should know about this and not the unit?
        //REVIEW: Specify how to display this in the editor.
		[XmlAttribute("framesPerRow")]
		[JsonProperty("framesPerRow")]
		public int FramesPerRow { get; set; }

		[XmlAttribute("framesPerCol")]
		[JsonProperty("framesPerCol")]
		public int FramesPerColumn { get; set; }

		[XmlArrayItem("animation")]
		[XmlArray("animations")]
		[JsonProperty("animations")]
		public AnimationCollection Animations { get; set; }

		public AnimatedSpriteUnit()
		{
			Animations = new AnimationCollection();
			FramesPerRow = 1;
			FramesPerColumn = 1;
		}

		public override string GenerateCode()
		{
			//REVIEW: Put all this in a file, also 1,2,3,4,5,6,7,8,9,10,11.
			var code = string.Format(
				@"
			var unit = createUnit({0}, {1}, '{2}', '{3}', {4}, {5}, {6}, {7}, {8}, {9}, {10}, {11}, {12}, {13});
			", "AnimatedSpriteUnit", IsPrototype.ToString().ToLowerInvariant(), Id, Texture, Animations.GenerateCode(this.Id, FramesPerRow), 
				FramesPerRow, FramesPerColumn,
				Position.X, Position.Y, Size.Width, Size.Height, HealthPoints, Rotation.X, Rotation.Y);

			code += base.GenerateCode();

			return code;
		}
	}
}
