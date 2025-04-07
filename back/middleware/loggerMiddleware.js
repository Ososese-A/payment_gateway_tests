const logger = (req, res, next) => {
    const Urlpath = req.path 
    const method = req.method
    console.log(`Incoming ${method} request to ${Urlpath}`)
    next()
}

module.exports = logger