using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Xml.Serialization;
using Newtonsoft.Json;

namespace GameMaker.ModelStructure
{
	public class Background : ICodeGenerator
	{
		//REVIEW: What if we want a solid color?
		[XmlAttribute("texture")]
		[JsonProperty("texture", DefaultValueHandling=DefaultValueHandling.Include)]
		public string Texture { get; set; }

		public string GenerateCode() 
		{
			if (string.IsNullOrEmpty(Texture))
				return string.Empty;

			//REVIEW: Tab the shit out of this.
			return string.Format(
		@"var background = new Image();
		background.src = '{0}';
		background.onload = loader.onImageLoaded;
		loader.imagesToLoad++;
		background.draw = function() {{
			context.drawImage(this, 0, 0, canvas.width, canvas.height);
		}}", Texture);
		}
	}
}
