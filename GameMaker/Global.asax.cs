using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Routing;
using System.Xml.Serialization;
using System.Text;
using GameMaker.ModelStructure;

namespace GameMaker.WebApp
{
	// Note: For instructions on enabling IIS6 or IIS7 classic mode, 
	// visit http://go.microsoft.com/?LinkId=9394801
	public class Application : System.Web.HttpApplication
	{
		public static ModuleCollection PresetModules;
		public static string Template;
        public static string RootPath;

		protected void Application_Start()
		{
			Initialize();
			CombineIndex();
		}

        protected void Session_Start()
        {
            CombineIndex();
        }

        protected void Application_BeginRequest()
        {
			//REVIEW: This is not how you do things in MVC.
            if (Request.Path == "default.aspx")
                Response.Redirect("Data/index.html");
        }

		protected void Initialize()
        {
            RootPath = Server.MapPath(PathFinder.Root);

			string unitPresetModulesPath = Path.Combine(RootPath, PathFinder.DefaultUnitModules),
				gamePresetModulesPath = Path.Combine(RootPath, PathFinder.DefaultGameModules);

			var moduleSerializer = new XmlSerializer(typeof(ModuleCollection));
			using (var unitFile = File.OpenRead(unitPresetModulesPath)) 
			using (var gameFile = File.OpenRead(gamePresetModulesPath))
			{
				var unitModules = moduleSerializer.Deserialize(unitFile) as ModuleCollection;
				var gameModules = moduleSerializer.Deserialize(gameFile) as ModuleCollection;
				PresetModules = new ModuleCollection(unitModules.Concat(gameModules));
            } 
            CreateConfigFile();
			GameMaker.PathFinder.CreateExtensionsScipt(Path.Combine(RootPath, @"Scripts/Extensions.js"));
		}

        private static void CreateConfigFile()
        {    
            string configPath = Path.Combine(RootPath, PathFinder.ConfigFile);
            using (var configFile = new StreamWriter(File.Open(configPath, FileMode.Create)))
            using (var modelXml = File.OpenRead(Path.Combine(RootPath, PathFinder.EmptyModel)))
            using (var eventsXml = File.OpenRead(Path.Combine(RootPath, PathFinder.DefaultEvents)))
			using (var unitModulesXml = File.OpenRead(Path.Combine(RootPath, PathFinder.DefaultUnitModules)))
			using (var gameModulesXml = File.OpenRead(Path.Combine(RootPath, PathFinder.DefaultGameModules)))
            {
                var serializer = new XmlSerializer(typeof(GameModel));
			    var model = serializer.Deserialize(modelXml) as GameModel;
			    var moduleSerializer = new XmlSerializer(typeof(ModuleCollection));
                var unitModules = moduleSerializer.Deserialize(unitModulesXml) as ModuleCollection;
				var gameModules = moduleSerializer.Deserialize(gameModulesXml) as ModuleCollection;
			    var events = moduleSerializer.Deserialize(eventsXml) as ModuleCollection;

				//REVIEW: Put this in a constant. Also, put the entire method in a class (maybe the generator class).
                configFile.WriteLine(
                    @"config = {{
    model: {0},
    unitModules: {1},
	gameModules: {2},
    events: {3},
}};", JsonConvert.SerializeObject(model), JsonConvert.SerializeObject(unitModules), JsonConvert.SerializeObject(gameModules), JsonConvert.SerializeObject(events));
            }
        }

        protected void CombineIndex()
        {
            var rootPath = RootPath;

            //file table
            var viewList = new List<string>() { "/Views/Home.html", "/Views/Lobby.html",
												"/Views/Games.html", "/Views/Create.html",
												"/Views/Community.html", "/Views/Play.html" };

            StringBuilder indexTemplate = new StringBuilder(),
                viewCollection = new StringBuilder();

            //read template
            indexTemplate.Append(File.ReadAllText(rootPath + "/Views/Main.html"));

            foreach (var view in viewList)
            {
                viewCollection.Append(File.ReadAllText(rootPath + view));
            }

            indexTemplate.Replace("@view_placeholder", viewCollection.ToString());

            //dialogs fast hack
            indexTemplate.Replace("@additional_placeholder", File.ReadAllText(rootPath + "/Views/Dialogs.html"));

            using (StreamWriter index = new StreamWriter(rootPath + "/index.html", false))
            {
                index.Write(indexTemplate.ToString());
            }
        }
	}
}