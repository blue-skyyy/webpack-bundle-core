
import person from "./instance.js"



function logName() {

  console.log(`%c${JSON.stringify(person)}`, 'color:blue')
  
  console.log(`my name is ${person.name}`)
}


logName()
