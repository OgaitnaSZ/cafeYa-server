import bcryptjs from 'bcryptjs'

/**  
* Contraseña sin encripttar: hola.01
* @param {*} passwordPlain
*/
const encrypt = async(passwordPlain: string) => {
    return await bcryptjs.hash(passwordPlain, 10)
}

/**  
* Contraseña sin encripttar y encriptada
* @param {*} passwordPlain
* @param {*} hashPassword
*/
const compare = async(passwordPlain: string, hashPassword: string) => {
    return await bcryptjs.compare(passwordPlain, hashPassword)
}

export { encrypt, compare }