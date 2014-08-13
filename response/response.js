module.exports = response

function response(status, headers, body) {
  return Object.create(response,
    { status  : { writable: true, value: status  }
    , headers : { writable: true, value: headers }
    , body    : { writable: true, value: body    }
    }
  )

  return respond
}