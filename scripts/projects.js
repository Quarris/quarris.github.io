let projects = {
    "minecraft": [
        {
            "name": "Enchantability",
            "icon": "img/projects/ench.png",
            "description": "Enchantability is a mod which allows you to enchant yourself with unique abilities by placing enchanted books into your <b>Ender Chest</b>",
            "details": "Each enchanted book has been given an ability which is tailored to how the enchant behaves but specifically made unique as to not make the original <span style='color:DarkOrchid'>enchantment</span> obsolete",
            "links": [
                {
                    "name": "CurseForge",
                    "link": "https://www.curseforge.com/minecraft/mc-mods/enchantability"
                },
                {
                    "name": "Github",
                    "link": "https://github.com/Quarris/Enchantability"
                }
            ]
        },
        {
            "name": "Void Tanks",
            "icon": "img/projects/voidtanks.png",
            "description": "Simple tiered tanks with voiding upgrade",
            "details": "Adds 4 tiers of tanks: <span style='color:DimGray'>Stone</span>, <span style='color:LightSlateGray'>Iron</span>, <span style='color:GoldenRod'>Gold</span> and <span style='color:DarkTurquoise'>Diamond</span>, which can be upgraded with a <span style='color:DarkOrchid'>Void</span> upgrade, allowing you to destroy fluids that get inserted when the tank is full",
            "links": [
                {
                    "name": "CurseForge",
                    "link": "https://www.curseforge.com/minecraft/mc-mods/void-tanks"
                },
                {
                    "name": "Github",
                    "link": "https://github.com/Quarris/VoidTanks"
                }
            ]
        },
        {
            "name": "Pretty Pipes: Fluids",
            "icon": "img/projects/ppfluids.png",
            "description": "Addon mod to Pretty Pipes, allows for fluid tranport",
            "details": "Adds pipes which can hook up tanks into existing Pipe Networks, allows for extraction, insertion and filtering of fluids",
            "links": [
                {
                    "name": "CurseForge",
                    "link": "https://www.curseforge.com/minecraft/mc-mods/pretty-pipes-fluids"
                },
                {
                    "name": "Github",
                    "link": "https://github.com/Quarris/PrettyFluidPipes"
                }
            ]
        }
    ],
    "commissions": [
        {
            "name": "Enigmatic Graves",
            "icon": "img/projects/enigmaticgraves.png",
            "description": "Intuitive and Persistant graves",
            "details": "Spawn a grave when you die with all your loot and will sort everything back neatly in your inventory when you pick it back up. Provides easy to use commands for retrieving grave just in case something goes wrong.",
            "links": [
                {
                    "name": "CurseForge",
                    "link": "https://www.curseforge.com/minecraft/mc-mods/enigmatic-graves"
                },
                {
                    "name": "Github",
                    "link": "https://github.com/Quarris/EnigmaticGraves"
                }
            ]
        },
        {
            "name": "Rebirth of the Mobs",
            "icon": "img/projects/rotm.png",
            "description": "Rebirth of the Mobs allows you to write configs to customise additional behaviour in mobs.",
            "details": "The behaviours range from adding immunities to mobs to spawning monsters when an entity is below certain health and allowing mobs to regen health whenever they slain their enemies",
            "links": [
                {
                    "name": "CurseForge",
                    "link": "https://www.curseforge.com/minecraft/mc-mods/rebirth-of-the-mobs"
                },
                {
                    "name": "Github",
                    "link": "https://github.com/Quarris/RebirthOfTheMobs"
                }
            ]
        },
        {
            "name": "Builder's Flight",
            "icon": "img/projects/buildersflight.png",
            "description": "A different take on flight",
            "details": "Adds a potion which allows the user to flight for a certain amount of time. The flight is different to that of crative flight and other common implementations. The effect you gain from this flight has awesome visual effects as well as different flight mechanic!",
            "links": [
                {
                    "name": "CurseForge",
                    "link": "https://www.curseforge.com/minecraft/mc-mods/builders-flight"
                },
                {
                    "name": "Github",
                    "link": "https://github.com/Quarris/BuildersFlight"
                }
            ]
        },
        {
            "name": "Engulfing Darkness",
            "icon": "img/projects/darkness.png",
            "description": "Be aware of the shadows, as evil lurks within them",
            "details": "As you enter the shadows, darkness will slowly surround you and eventually will begin to hurt you.",
            "links": [
                {
                    "name": "CurseForge",
                    "link": "https://www.curseforge.com/minecraft/mc-mods/engulfing-darkness"
                },
                {
                    "name": "Github",
                    "link": "https://github.com/Quarris/EngulfingDarkness"
                }
            ]
        },
        {
            "name": "Pick Pocketer",
            "icon": "img/projects/pp.png",
            "description": "Pick Pocketer allows players to steal from their enemies!",
            "details": "You can steal from mobs, for loot is either generated from the mobs loot table or customised in configs, and players, which is limited to single item per steal attempt and the victim has a chance of being notified of it!",
            "links": [
                {
                    "name": "CurseForge",
                    "link": "https://www.curseforge.com/minecraft/mc-mods/pick-pocketer"
                },
                {
                    "name": "Github",
                    "link": "https://github.com/Quarris/PickPocketer"
                }
            ]
        }
    ]
}

let minecraftElement = document.getElementById("projects-minecraft");
let commissionsElement = document.getElementById("projects-commissions");

projects.minecraft.forEach(project => {
    addProject(minecraftElement, project);
})

projects.commissions.forEach(project => {
    addProject(commissionsElement, project);
})

function addProject(element, project) {
    element.innerHTML += `
    <div class="jumbotron project">
        <div class="container">
            <div class="row">
                <div class="col-auto">
                    <img class="project-img" src="${project.icon}">
                </div>
                <div class="col">
                    <h2><b>${project.name}</b></h2>
                </div>
            </div>
        </div>
        <p class="lead">${project.description}</p>
        <hr>
        <p>${project.details}</p>
        ${project.links.map(link => getProjectLinkHtml(link)).join(" ")}
    </div>
    `
}

function getProjectLinkHtml(link) {
    return `<a class="btn btn-primary btn-lg" href="${link.link}"
    role="button">${link.name}</a>`
}