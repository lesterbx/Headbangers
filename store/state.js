import firebaseApp from '~/firebaseapp'
export default {
    userProfile: null,
    userData: null,
    isAuthenticated: null,
    concertsList: null,
    concertDetails: null,
    concertsListRef: null,
    concertsFullRef: null,
    usersRef: null,
    countryList: require('~/static/utils/countries.js').Countries,
    genreList: require('~/static/utils/genres.js').Genres,
    pageSize: 6,
    loading: false
}
