using Newtonsoft.Json;
using System.Xml.Serialization;

namespace GameMaker.Model_Structure.Units
{
	public struct Size
	{
		[EditorField(EditorField.EditorType.Formula)]
		[XmlAttribute("width")]
		[JsonProperty("width", DefaultValueHandling = DefaultValueHandling.Include)]
		public string Width { get; set; }

		[EditorField(EditorField.EditorType.Formula)]
		[XmlAttribute("height")]
		[JsonProperty("height", DefaultValueHandling = DefaultValueHandling.Include)]
        public string Height { get; set; }
	}
}
