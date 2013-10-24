using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Serialization;
using Newtonsoft.Json;

namespace GameMaker.ModelStructure.Units
{
	public class RectangleUnit : Unit
	{
        [EditorFieldAttribute(EditorFieldAttribute.EditorType.Color)]
		[XmlAttribute("color")]
		[JsonProperty("color")]
		public string Color { get; set; }

		/// <summary>
		/// Generates the code that creates the new unit.
		/// </summary>
		/// <returns></returns>
		public override string GenerateCode()
		{
			var code = string.Format(
				@"
			var unit = createUnit({0}, {1}, '{2}', '{3}', {4}, {5}, {6}, {7}, {8});
			", "RectangleUnit", IsPrototype.ToString().ToLowerInvariant(), Id, Color, Position.X, Position.Y, Size.Width, Size.Height, HealthPoints);
			
			return code + base.GenerateCode();
		}
	}
}