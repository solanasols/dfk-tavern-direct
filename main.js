/*! For license information please see main.js.LICENSE.txt */
	query {
    heros(
      first: 1000,
      skip: ${a},
      where: {
        ${e}
      }
    ) {
      id
    }