using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Serialization;
using Newtonsoft.Json;

namespace GameMaker.Model_Structure.Units
{
	/// <summary>
	/// Represents a single unit with no animations.
	/// </summary>
	public class InanimatedSpriteUnit : Unit
	{
		/// <summary>
		/// Gets or sets the texture.
		/// </summary>
        [EditorField(EditorField.EditorType.Picture)]
		[XmlAttribute("texture")]
		[JsonProperty("texture")]
		public string Texture { get; set; }

		//REVIEW: Definitely should have an interface for this.
		public override string GenerateCode()
		{
			//REVIEW: also, 1,3,4,5,6,7,8,
			var code = string.Format(
				@"
			var unit = createUnit({0}, {1}, '{2}', '{3}', {4}, {5}, {6}, {7}, {8});
			", "InanimatedSpriteUnit", IsPrototype.ToString().ToLowerInvariant(), Id, Texture, Position.X, Position.Y, Size.Width, Size.Height, HealthPoints);

			return code + base.GenerateCode();
		}
	}
}