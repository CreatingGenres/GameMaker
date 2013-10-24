using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GameMaker.ModelStructure
{
	public static class EventExtensions
	{
		public static string GenerateEventsCode(this IEnumerable<Event> events)
		{
			// Use an annonimous self-calling function to create an object that holds all eventhandlers

			// Partition all eventhandlers by the event their attached to
			IEnumerable<IEnumerable<Event>> partition = events.Partition(x => x.Name);
			StringBuilder eventsCode = new StringBuilder();
			eventsCode.AppendLine("(function () { var events = [];");
			foreach (IEnumerable<Event> set in partition.Where(x => x.Count() != 0))
			{
				// Foreach  event, create a function that calls the eventhandlers
				eventsCode.AppendFormat("events['{0}'] = function(args) {{", set.First().Name);

				foreach (Event eventHandler in set)
				{
					// Foreach eventhandler:
					// If it has requirements, wrap the call to the eventhandler in an if-statement
					if (eventHandler.Requirements.Count() != 0)
					{
						eventsCode.Append("if (");
						foreach (var requirement in eventHandler.Requirements)
						{
							if (requirement.Value.Contains("/"))
							{
								string[] options = requirement.Value.Split('/');
								eventsCode.Append("(");
								foreach (string option in options)
								{
									//REVIEW: remove evals
									eventsCode.AppendFormat("args['{0}'] == eval(\"{1}\") || ", requirement.Name, option);
								}

								// Remove the last 2 ||
								eventsCode.Remove(eventsCode.Length - 3, 2);
								eventsCode.Append(") &&");
							}
							else
							{
								// REVIEW: remove evals
								eventsCode.AppendFormat("args['{0}'] == eval(\"{1}\") && ", requirement.Name, requirement.Value);
							}
						}

						// Remove the last 2 &&
						eventsCode.Remove(eventsCode.Length - 3, 2);
						eventsCode.AppendLine(")");
					}
					// Call the handler
					eventsCode.AppendFormat("basicEventHandler(this, {0}, {1});\n", eventHandler.FormatArgs(), eventHandler.Action.GenerateCode());
				}
				eventsCode.AppendLine("};");
			}
			eventsCode.AppendLine("return events; })();");
			return eventsCode.ToString();
		}
	}
}
