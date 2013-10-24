using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace GameMaker.ModelStructure
{
	public static class Helper
	{
		/// <summary>
		/// For each element in the collection, executes the given function that returns the code for the elements and returns the whole block of code.
		/// </summary>
		public static string GenerateCollectionCode<T>(this IEnumerable<T> collection, Func<T, string> func)
		{
			StringBuilder code = new StringBuilder();
			foreach (var codeElement in collection)
			{
				code.AppendLine(func(codeElement));
			}
			return code.ToString();
		}
        
        /// <summary>
        /// Enumerates all the specified types, finds all their properties and fields that have the specified attribute and extracts the value of the attribute.
        /// The returned dictionary is &lt;typeName, &lt;memberName, valueOfTheAttribute&gt;&gt;
        /// </summary>
        /// <param name="types">The collection of <see cref="System.Type"/>  to enumerate.</param>
        /// <param name="attributeType">The type of the attribute to look for.</param>
        /// <param name="propertyInfo">The property whose value to extract from the members.</param>
        /// <returns></returns>
        public static Dictionary<string, Dictionary<string, string>> GetTypeAttributesData(
            IEnumerable<Type> types, 
            Type attributeType, 
            PropertyInfo propertyInfo)
        {
            var data = new Dictionary<string, Dictionary<string, string>>();
            foreach (Type type in types)
            {
                IEnumerable<MemberInfo> members = type.GetProperties().Union<MemberInfo>(type.GetFields());
                data[type.Name.ConvertToCase(Case.CamelCase)] = GetCustomAttributeData(attributeType, propertyInfo, members);
            }
            return data;
        }

        private static Dictionary<string, string> GetCustomAttributeData(Type attributeType, PropertyInfo property, IEnumerable<MemberInfo> members)
        {
            Dictionary<string, string> data = new Dictionary<string, string>();

            foreach (var member in members)
            {
                var attributes = member.GetCustomAttributes(attributeType, false).FirstOrDefault();
                if (attributes == null)
                    continue;

                data[member.Name.ConvertToCase(Case.CamelCase)] = property.GetValue(attributes).ToString().ConvertToCase(Case.CamelCase);
            }

            return data;
        }

		public static string FormatParams(this IEnumerable<ModuleArgument> args)
        {
            if (args == null || args.FirstOrDefault() == null)
                return "new Object({})";

            StringBuilder builder = new StringBuilder();
            builder.Append("new Object({");
            foreach (var arg in args)
            {
                //TODO: dumb ass zero Zero because dunno
                if (arg.Value == null)
                    arg.Value = "0";
                builder.AppendFormat(@"{0}: '{1}', ", arg.Name, arg.Value);
            }
            builder.Append("})");
            return builder.ToString();
        }

        public static IEnumerable<IEnumerable<T>> Partition<T>(this IEnumerable<T> collection, Func<T, string> function)
        {
            IDictionary<string, ISet<T>> dictionary = new Dictionary<string, ISet<T>>();
            foreach (var item in collection)
            {
                var code = function(item);
                if (!dictionary.ContainsKey(code))
                    dictionary[code] = new HashSet<T>();

                dictionary[code].Add(item);
            }
            return dictionary.Values.ToArray();
        }

		/// <summary>
        /// Gets the member's underlying type.
        /// </summary>
        /// <param name="member">The member.</param>
        /// <returns>The underlying type of the member.</returns>
        public static Type GetMemberUnderlyingType(this MemberInfo member)
        {
            switch (member.MemberType)
            {
                case MemberTypes.Field:
                    return ((FieldInfo)member).FieldType;
                case MemberTypes.Property:
                    return ((PropertyInfo)member).PropertyType;
                case MemberTypes.Event:
                    return ((EventInfo)member).EventHandlerType;
                default:
					return null;
            };
		}

		/// <summary>
		/// Converts the phrase to specified convention.
		/// </summary>
		/// <param name="phrase"></param>
		/// <param name="cases">The cases.</param>
		/// <returns>string</returns>
		public static string ConvertToCase(this string phrase, Case cases)
		{
			string[] splittedPhrase = phrase.Split(' ', '-', '.');
			var sb = new StringBuilder();

			if (cases == Case.CamelCase)
			{
				sb.Append(splittedPhrase[0].ToLower());
				splittedPhrase[0] = string.Empty;
			}
			else if (cases == Case.PascalCase)
				sb = new StringBuilder();

			foreach (string s in splittedPhrase)
			{
				char[] splittedPhraseChars = s.ToCharArray();
				if (splittedPhraseChars.Length > 0)
				{
					splittedPhraseChars[0] = (new string(splittedPhraseChars[0], 1)).ToUpper().ToCharArray()[0];
				}
				sb.Append(new string(splittedPhraseChars));
			}
			return sb.ToString();
		}

		public enum Case
		{
			PascalCase,
			CamelCase
		}

		public class EqualityComparer<T> : System.Collections.Generic.EqualityComparer<T>
		{
			public Func<T, T, bool> EqualsPredicate { get; set; }
			public Func<T, int> GetHashCodeFunc { get; set; }

			public EqualityComparer(Func<T, T, bool> equals, Func<T, int> hashCode)
			{
				this.EqualsPredicate = equals;
				this.GetHashCodeFunc = hashCode;
			}

			/// <summary>
			/// When overridden in a derived class, determines whether two objects of type <paramref name="T" /> are equal.
			/// </summary>
			/// <param name="x">The first object to compare.</param>
			/// <param name="y">The second object to compare.</param>
			/// <returns>
			/// true if the specified objects are equal; otherwise, false.
			/// </returns>
			public override bool Equals(T x, T y)
			{
				return this.EqualsPredicate(x, y);
			}

			/// <summary>
			/// Returns a hash code for this instance.
			/// </summary>
			/// <param name="obj">The obj.</param>
			/// <returns>
			/// A hash code for this instance, suitable for use in hashing algorithms and data structures like a hash table. 
			/// </returns>
			public override int GetHashCode(T obj)
			{
				return this.GetHashCodeFunc(obj);
			}
		}
	}
}
