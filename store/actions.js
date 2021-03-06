import { firebaseAction } from 'vuexfire'
import firebaseApp from '~/firebaseapp'
import { WSAEHOSTUNREACH } from 'constants';
export default {
    publishConcert: ({state, dispatch, commit}, {concert, shortConcert}) => {
        commit('setLoading', true)
        let posterRef = '/posters/'+concert.author+concert.info.poster.name;
        return dispatch('uploadFile', {file: concert.info.poster.raw, path: posterRef}).then((snapshot) => {
            concert.info.poster = snapshot.downloadURL
            concert.posterRef = posterRef
            shortConcert.poster = snapshot.downloadURL
            let concertKey = state.concertsFullRef.push(concert).key
            state.allConcertsRef.child(concertKey).set(shortConcert)
            state.usersRef.child(state.userProfile.uid).child('published').child(concertKey).set(true)
            commit('setLoading', false)
            return Promise.resolve(concertKey)
        })
    },
    removeConcert: ({state, dispatch}, concertKey) => {
        state.usersRef.once('value').then(users => {
            let updates = {}
            updates['/concertsFull/' + concertKey] = null
            updates['/concertsList/' + concertKey] = null
            users.forEach(user => {
                updates['/users/' + user.key + '/liked/' + concertKey] = null
                updates['/users/' + user.key + '/published/' + concertKey] = null
                updates['/users/' + user.key + '/saved/' + concertKey] = null
                updates['/users/' + user.key + '/assisting/' + concertKey] = null
            })
            state.concertsFullRef.child(concertKey).child('/posterRef').once('value').then(data => {
                dispatch('removeFile', data.val())
                firebaseApp.database().ref().update(updates)
            })
        })
    },
    getUserCountry: ({commit, state}) => {
        return new Promise((resolve, reject) => {
            if(state.userCountry){
                resolve(state.userCountry)
            }else{
                geolocator.locateByIP({addressLookup: true}, (err, location) => {
                    if(err){
                        reject(err)
                    }else{
                        state.userCountry = location.address.countryCode
                        resolve(location.address.countryCode)
                    }
                })
            }
        }) 
    },
    askUserLocation: ({commit, state}) => {
        return new Promise((resolve, reject) =>{ 
            if(state.location){
                resolve(state.location)
            } else {
                geolocator.locate({fallbackToIP: true, addressLookup: true}, (err, location) => {
                    if(err){
                        reject(err)
                    }else{
                        commit('setUserLocation', {...location.address, coords: location.coords})
                        resolve({...location.address, coords: location.coords})
                    }
                })
            }
        })
    },
    bindAuth: ({commit, dispatch, state}) => {
        return new Promise(resolve => {
            firebaseApp.auth().onAuthStateChanged(user => {
                if (user) {
                    commit('setUserProfile', {uid: user.uid, displayName: user.displayName, email: user.email, photoURL: user.photoURL, providerData: user.providerData})
                    commit('setAuthenticated', true)
                    dispatch('bindUserData', user.uid)
                    state.usersRef.child(user.uid).child('exist').set(true)
                    resolve(true)
                } else {
                    commit('setUserProfile', null)
                    commit('setUserData', null)
                    commit('setAuthenticated', false)
                    dispatch('unbindUserData')
                    resolve(false)
                }
            })
        })
    },
    configSlideout () {
        var slideout = new Slideout({
            'panel': document.querySelector('main'),
            'menu': document.querySelector('#side-menu'),
            'touch': false,
            'padding': 256,
        })
        document.querySelector('#menu-button').onclick = () => slideout.toggle()
        window.innerWidth > 768 && slideout.open()
        document.querySelectorAll('#side-menu .el-menu-item').forEach((item) => { item.onclick = () => { window.innerWidth < 768 && slideout.close() } })
    },
    bindUserData: firebaseAction(({state, dispatch}, id) => {
        dispatch('bindFirebaseReference', {reference: state.usersRef.child(id), toBind: 'userData'})
    }),
    unbindUserData: firebaseAction(({state, dispatch}) => {
        dispatch('unbindFirebaseReference', {toUnbind: 'userData'})
    }),
    signIn: ({state, commit}, {email, password}) => {
        commit('setLoading', true)
        return firebaseApp.auth().signInWithEmailAndPassword(email, password).then(() => commit('setLoading', false))
    },
    signOut: ({state}) => {
        return firebaseApp.auth().signOut()
    },
    uploadFile: ({}, {file, path}) => {
        return firebaseApp.storage().ref().child(path).put(file)
    },
    removeFile: ({}, path) => {
        return firebaseApp.storage().ref().child(path).delete()
    },
    updatePicture: ({state, dispatch}, {file, path}) => {
        return dispatch('uploadFile', {file, path}).then((snapshot) => {
            return firebaseApp.auth().currentUser.updateProfile({
                photoURL: snapshot.downloadURL
            }).then(() => state.userProfile.photoURL = snapshot.downloadURL)
        })
    },
    updateName: ({state}, displayName) => {
        return firebaseApp.auth().currentUser.updateProfile({displayName})
    },
    updateEmail: ({state}, {newEmail, currentEmail, currentPassword}) => {
        return firebaseApp.auth().signInWithEmailAndPassword(currentEmail, currentPassword).then((user) => {
            return firebaseApp.auth().currentUser.updateEmail(newEmail).then(() => state.userProfile.email = newEmail)
        })
    },
    updatePassword: ({state}, {currentEmail, currentPassword, newPassword}) => {
        return firebaseApp.auth().signInWithEmailAndPassword(currentEmail, currentPassword).then((user) => {
            return firebaseApp.auth().currentUser.updatePassword(newPassword)
        })
    },
    sendPasswordEmail: ({state}, email) => {
        return firebaseApp.auth().sendPasswordResetEmail(email)
    },
    likeConcert: ({state}, concertID) => {
        state.concertsFullRef.child(concertID).child('likes').transaction((likes) => likes + 1)
        state.allConcertsRef.child(concertID).child('likes').transaction((likes) => likes + 1)
        state.usersRef.child(state.userProfile.uid).child('liked').child(concertID).set(true)
    },
    saveConcert: ({state}, concertID) => {
        state.usersRef.child(state.userProfile.uid).child('saved').child(concertID).set(true)
    },
    assistConcert: ({state}, concertID) => {
        state.concertsFullRef.child(concertID).child('assisting').transaction((assistants) => assistants + 1)
        state.allConcertsRef.child(concertID).child('assisting').transaction((assistants) => assistants + 1)
        state.usersRef.child(state.userProfile.uid).child('assisting').child(concertID).set(true)
    },
    leaveConcert: ({state}, concertID) => {
        state.concertsFullRef.child(concertID).child('assisting').transaction((assistants) => assistants - 1)
        state.allConcertsRef.child(concertID).child('assisting').transaction((assistants) => assistants - 1)
        state.usersRef.child(state.userProfile.uid).child('assisting').child(concertID).set(null)
    },
    unlikeConcert: ({state}, concertID) => {
        state.concertsFullRef.child(concertID).child('likes').transaction((likes) => likes - 1)
        state.allConcertsRef.child(concertID).child('likes').transaction((likes) => likes - 1)
        state.usersRef.child(state.userProfile.uid).child('liked').child(concertID).set(null)
    },
    unsaveConcert: ({state}, concertID) => {
        state.usersRef.child(state.userProfile.uid).child('saved').child(concertID).set(null)
    },
    concertExists: ({state}, key) => {
        return new Promise(resolve => {
            state.allConcertsRef.child(key).once('value').then(data => {
                resolve(data.val() !== null)
            })
        })
    },
    bindAllConcerts: firebaseAction(({state, dispatch}) => {
        return dispatch('bindFirebaseReference', {reference: state.allConcertsRef, toBind: 'allConcerts'})
    }),
    bindCountryConcerts: firebaseAction(({state, dispatch}) => {
        return dispatch('bindFirebaseReference', {reference: state.countryConcertsRef, toBind: 'countryConcerts'})
    }),
    bindConcert: firebaseAction(({state, dispatch, commit}, id) => {
        if(!state.concertsFullRef){
            commit('setConcertsFullRef')
        }
        return dispatch('bindFirebaseReference', {reference: state.concertsFullRef.child(id), toBind: 'concertDetails'})
    }),
    unbindAllConcerts: firebaseAction(({dispatch}) => {
        dispatch('unbindFirebaseReference', {toUnbind: 'allConcerts'})
    }),
    unbindCountryConcerts: firebaseAction(({dispatch}) => {
        dispatch('unbindFirebaseReference', {toUnbind: 'countryConcerts'})
    }),
    unbindConcert: firebaseAction(({dispatch}) => {
        dispatch('unbindFirebaseReference', {toUnbind: 'concertDetails'})
    }),
    bindFirebaseReference: firebaseAction(({bindFirebaseRef, state, commit}, {reference, toBind}) => {
        commit('setLoading', true)
        return new Promise(resolve => {
            reference && reference.once('value').then(snapshot => {
                if(snapshot.val()){
                    bindFirebaseRef(toBind, reference, {
                        readyCallback: (() => {
                            commit('setLoading', false)
                            resolve(true)
                        })
                    })
                } else {
                    commit('setLoading', false)
                    state.countryConcerts = {}
                    resolve(false)
                }
            })
        })
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
