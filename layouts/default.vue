<template>
    <div>
        <div v-if='showSplash'>
            <splash></splash>
        </div>
        <div>
            <header-component></header-component>
            <side-menu></side-menu>
            <main>
                <nuxt />
                <footer-component></footer-component>
            </main>
        </div>
    </div>
</template>

<script>
    import HeaderComponent from '~/components/header/HeaderComponent'
    import SideMenu from '~/components/SideMenu'
    import Splash from '~/components/Splash'
    import FooterComponent from '~/components/FooterComponent'
    import { mapActions, mapMutations, mapGetters } from 'vuex'
    export default {
        components: {
            HeaderComponent,
            SideMenu,
            Splash,
            FooterComponent
        },
        data () {
            return {
                showSplash: true
            }
        },
        computed: {
            ...mapGetters({loading: 'getLoading'})
        },
        beforeMount () {
            this.configGeolocator()
            this.getUserCountry().then(country => this.setCountryConcertsRef(country))
            this.setUsersRef()
            this.setAllConcertsRef()
            this.setConcertsFullRef()
        },
        created () {
            setTimeout(() => this.showSplash = false, 2000)
            if (process.browser) {
                window.onNuxtReady((app) => { 
                    this.bindAuth().then((isAuth) =>{
                        if(process.env.authNeeded.includes(this.$route.name) && !isAuth){
                            this.$router.push('login')
                        }else if(this.$route.name == 'login' && isAuth){
                            this.$router.push('/')
                        }
                    })
                    this.configSlideout()
                })
            }

        },
        methods: {
            ...mapActions(['bindAuth', 'setUsersRef', 'getUserCountry', 'configSlideout']),
            ...mapMutations(['setUsersRef', 'setCountryConcertsRef', 'setConcertsFullRef', 'setAllConcertsRef']),
            configGeolocator(){
                geolocator.config({
                    google: {
                        version: "3",
                        key: process.env.googleMapsKey
                    }
                })
            }
        }
    }
</script>