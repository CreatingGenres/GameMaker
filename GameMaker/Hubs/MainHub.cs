using Ionic.Zip;
using Microsoft.AspNet.SignalR;
using Newtonsoft.Json;
using System.Linq;
using System.Collections.Generic;
using System.IO;
using System.Text.RegularExpressions;
using GameMaker.ModelStructure;

namespace GameMaker.WebApp.Hubs
{
	public class MainHub : Hub
	{
		// TODO: TEST IF COMPRESSING ACTUALLY DOESNT BREAK ANYTHING!
		public string GenerateGame(string json)
        {
            string code = GenerateGameCode(json);
            string path = PathFinder.GetGameFilePath();
			
            File.WriteAllText(Path.Combine(Application.RootPath, path), code);
			return path;
		}

        public string GenerateGameArchive(string json)
        {
            string code = GenerateGameCode(json);
            using (var archive = new ZipFile())
            {
				//REVIEW: create a requirements table (low priority)
                archive.AddDirectory(Path.Combine(Application.RootPath, PathFinder.ImageLibrary), "images/library");
                archive.AddFile(Path.Combine(Application.RootPath, PathFinder.EmptyGame), string.Empty);
                archive.AddFile(Path.Combine(Application.RootPath, "Scripts\\libraries\\jquery-1.9.1.min.js"), "Scripts/");
                archive.AddFile(Path.Combine(Application.RootPath, "Scripts\\Extensions.js"), "Scripts/");
                archive.AddFile(Path.Combine(Application.RootPath, "game.css"), "Styles/");
                archive.AddEntry("game.js", code);

                var relativePath = PathFinder.GetGameArchiveNamePath();
                var absolutePath = Path.Combine(Application.RootPath, relativePath);
                archive.Save(absolutePath);

                return relativePath;
            }
        }

		public void PublishGame(string json)
		{
			GameModel model = DeserializeJson(json);
			string path = Path.Combine(Application.RootPath, PathFinder.GetPublishedGamePath(model.Name));

			using (StreamWriter writer = new StreamWriter(path))
			{
				model.SaveAs(GameModel.SupportedSaveFormats.Xml, writer);
			}
			Clients.All.gamePublished(model.Name);
		}

		public IEnumerable<string> GetPublishedGames()
		{
			string path = Path.Combine(Application.RootPath, PathFinder.PublishedGames);
			return Directory.GetFiles(path, "*.xml").Select(x => Path.GetFileNameWithoutExtension(x));
		}

		public string LoadPublishedGame(string gameName)
		{
			string path = Path.Combine(Application.RootPath, PathFinder.GetPublishedGamePath(gameName));
			if (!File.Exists(path))
			{
				throw new FileNotFoundException();
			}
			using (StreamReader reader = new StreamReader(path))
			{
				GameModel model = GameModel.Load(GameModel.SupportedSaveFormats.Xml, reader);
				var generator = new JsGenerator(Application.PresetModules);
				var code = generator.GenerateGameCode(model);

				string scriptPath = PathFinder.GetGameFilePath();
				File.WriteAllText(Path.Combine(Application.RootPath, scriptPath), code);
				return scriptPath;
			}
		}

        private static Dictionary<string, string> ReplacementTable = new Dictionary<string, string>()
        {
            { "Random", "Math.random()" },
            { "unitOffsetX", "this.x" },
            { "unitOffsetY", "this.y" },
			{ "time", "updateCounter" }
        };

		//REVIEW: put code in different class
        private static string GenerateGameCode(string json)
		{
			var model = DeserializeJson(json);
            var generator = new JsGenerator(Application.PresetModules);
            var code = generator.GenerateGameCode(model);
            return code;
        }

		private static GameModel DeserializeJson(string json)
		{
			foreach (var replacement in ReplacementTable)
			{
				json = Regex.Replace(json, replacement.Key, replacement.Value, RegexOptions.IgnoreCase);
			}
			var model = JsonConvert.DeserializeObject<GameModel>(json);
			return model;
		}
	}
}