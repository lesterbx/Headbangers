import { firebaseAction } from 'vuexfire'
import firebaseApp from '~/firebaseapp'
export default {
    publishConcert: ({commit, state}, {concert, shortConcert}) => {
        let concertKey = state.concertsFullRef.push(concert).key
        state.concertsListRef.child(concertKey).set(shortConcert)
    },
    setReferences: ({commit, state}, concertsList) => {
        commit('setReferences')
    },
    bindAuth: ({commit, dispatch, state}) => {
        firebaseApp.auth().onAuthStateChanged(user => {
            if (user) {
                commit('setUserProfile', user)
                commit('setAuthenticated', true)
                dispatch('bindUserData', user.uid)
                state.usersRef.child(user.uid).child('exist').set(true)
            } else {
                commit('setUserProfile', null)
                commit('setUserData', null)
                commit('setAuthenticated', false)
                dispatch('unbindUserData')
            }
        })
    },
    bindUserData: firebaseAction(({state, dispatch}, id) => {
        dispatch('bindFirebaseReference', {reference: state.usersRef.child(id), toBind: 'userData'})
    }),
    unbindUserData: firebaseAction(({state, dispatch}) => {
        dispatch('unbindFirebaseReference', {toUnbind: 'userData'})
    }),
    uploadImage: ({state}, {image, path}) => {
        let photoRef = firebaseApp.storage().ref().child(path)
        photoRef.put(image).then((snapshot) => {
          firebaseApp.auth().currentUser.updateProfile({
            photoURL: snapshot.downloadURL
          }) 
        })
    },
    updateName: ({state}, name) => {

    },
    updateEmail: ({state}, email) => {
        
    },
    likeConcert: ({state}, concertID) => {
        state.concertsFullRef.child(concertID).child('likes').transaction((likes) => likes + 1)
        state.concertsListRef.child(concertID).child('likes').transaction((likes) => likes + 1)
        state.usersRef.child(state.userProfile.uid).child('liked').child(concertID).set(true)
    },
    saveConcert: ({state}, concertID) => {
        state.usersRef.child(state.userProfile.uid).child('saved').child(concertID).set(true)
    },
    unlikeConcert: ({state}, concertID) => {
        state.concertsFullRef.child(concertID).child('likes').transaction((likes) => likes - 1)
        state.concertsListRef.child(concertID).child('likes').transaction((likes) => likes - 1)
        state.usersRef.child(state.userProfile.uid).child('liked').child(concertID).set(null)
    },
    unsaveConcert: ({state}, concertID) => {
        state.usersRef.child(state.userProfile.uid).child('saved').child(concertID).set(null)
    },
    bindConcertsList: firebaseAction(({state, dispatch}) => {
        dispatch('bindFirebaseReference', {reference: state.concertsListRef, toBind: 'concertsList'})
    }),
    bindConcert: firebaseAction(({state, dispatch}, id) => {
        dispatch('bindFirebaseReference', {reference: state.concertsFullRef.child(id), toBind: 'concertDetails'})
    }),
    unbindConcertsList: firebaseAction(({dispatch}) => {
        dispatch('unbindFirebaseReference', {toUnbind: 'concertsList'})
    }),
    unbindConcert: firebaseAction(({dispatch}) => {
        dispatch('unbindFirebaseReference', {toUnbind: 'concertDetails'})
    }),
    bindFirebaseReference: firebaseAction(({bindFirebaseRef, commit}, {reference, toBind}) => {
        commit('setLoading', true)
        reference.once('value').then(concerts => {concerts.val() && bindFirebaseRef(toBind, reference, {readyCallback: (() => commit('setLoading', false)), wait: true})})
    }),
    unbindFirebaseReference: firebaseAction(({unbindFirebaseRef}, {toUnbind}) => {
        try {
            unbindFirebaseRef(toUnbind)
        } catch (error) {
        }
    }),
    setLoading ({commit}, loading) {
        commit('setLoading', loading);
    }
}
