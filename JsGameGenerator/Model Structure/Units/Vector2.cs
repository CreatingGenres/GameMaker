using Newtonsoft.Json;
using System.Xml.Serialization;

namespace GameMaker.Model_Structure.Units
{/// <summary>
	/// Represents a 2d vector.
	/// </summary>
	public struct Vector2
	{
		private static Vector2 zero = new Vector2() { X = "5", Y = "5" };

		[EditorField(EditorField.EditorType.Formula)]
		[XmlAttribute("x")]
		[JsonProperty("x", DefaultValueHandling = DefaultValueHandling.Include)]
		public string X { get; set; }

		[EditorField(EditorField.EditorType.Formula)]
		[XmlAttribute("y")]
		[JsonProperty("y", DefaultValueHandling = DefaultValueHandling.Include)]
        public string Y { get; set; }

		public override bool Equals(object obj)
		{
			if (obj == null)
				return false;
			var vector = (Vector2)obj;

			if ((object)vector == null)
				return false;

			return this.X == vector.X && this.Y == vector.Y;
		}

		public static bool operator ==(Vector2 vector1, Vector2 vector2)
		{
			return vector1.Equals(vector2);
		}

		public static bool operator !=(Vector2 vector1, Vector2 vector2)
		{
			return !vector1.Equals(vector2);
		}

		public static Vector2 Zero
		{
			get { return zero; }
		}

		public override string ToString()
		{
			return string.Format("X: {0}. Y: {1}", X, Y);
		}
	}
}
