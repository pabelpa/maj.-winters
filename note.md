instead of writing to a file, it should write to a database to prevent merge issues with git

i want to add a channel that always displays the status of the batallions

i also want to add a channel that indexes all the existing squad configurations

when veiwing the status of a battalion, have commands associated with it so commands can be input faster

add a maximum amount of squads based on manpower
move the squad size to variants
when adding a squad it should be additive to original amounts (done)

add a command for upgrading squads to other variants

break up tickets into smaller tickets based on the easiest way to complete a single ticket

resupply tickets should be called manifests and are only associated with delivery not production

i can add a custom function to track things that cannot be stockpiled efficiently, like rockets or large shells. battalions will have a separate area to track large items associated with them and thinks like battle tanks or ships


I need some way to unify crates vs uncrated in terms of frieght and how the stockpile tracking handles tracking. In general all crates can be stockpiled but some uncrated things can be stockpiled like shippables and vehicles. Anything that is defined in a battalion should be treated as crates unless it is a vehicle or shippable, then it should be treated as an individual. For freight calculations, crateable vehicles adn shipables should have their cost consider the crated versions.

freight cost raw = f

if vehicle or shippable and can be crated then fcr=f/crate size -> rounded up to the nearest increment of 60


When loading toe data, anything that is not a vehicle or shippable should defined in terms of crates, while vics and shippables should be defined by singular items.

In fact, toe data should be defined in terms of individual items, then manifests get defined in terms of crates, where limits are placed on the amount of crates on a battalion. This will make defining squads much simpler.

we need to add in recipes from shipyards, construction yards, and garages too.

step 1: production keys will be the item name, but production descriptions can specify crates. wheter or not it can be crated will be a property along with crate size. mpf will not be a recipe but will always produce crates. only factory and mpf will have crate outputs. facilities and other construction sites will have uncrated outputs. infantry kit factories produce crates.