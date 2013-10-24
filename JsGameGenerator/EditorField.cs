using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GameMaker
{
    /// <summary>
    /// Defines how an editor would process the property
    /// </summary>
    [AttributeUsage(AttributeTargets.Field | AttributeTargets.Property)]
    public class EditorField : Attribute
    {
        [JsonConverter(typeof(StringEnumConverter))]
        /// <summary>
        /// Specifies how an editor would display the control to edit the property.
        /// </summary>
        public enum EditorType
        {
            /// <summary>
            /// A 32-bit integer
            /// </summary>
            Integer,
            /// <summary>
            /// A floating point number
            /// </summary>
            Float,
            /// <summary>
            /// A text with no special characters
            /// </summary>
            Text,
            /// <summary>
            /// A picture or texture
            /// </summary>
            Picture,
            /// <summary>
            /// A color, in HEX or RGB
            /// </summary>
            Color,
            /// <summary>
            /// A font, including size and color
            /// </summary>
            Font,
            /// <summary>
            /// A two dimensional vector.
            /// </summary>
            Vector,
            /// <summary>
            /// A formula which has a return value of Integer.
            /// </summary>
            Formula,
            /// <summary>
            /// This field is not to be edited directly
            /// </summary>
            None
        }

        public EditorField(EditorType editorType)
        {
            this.Type = editorType;
        }
        
        /// <summary>
        /// TODO: summary
        /// </summary>
        public EditorType Type { get; private set; }
    }
}
