<template>
    <nuxt-link to="/" exact>
        <img id="logo" src="/img/brand/header-logo.svg">
    </nuxt-link>
</template>
<style>
    #logo{
        margin-top: 0.4em;
        width: 10em;
    }    
@media(min-width: 768px) {
    #logo{
        margin-left: -15px;
        width: 13em;
        padding-top: 0;
    }    
}
</style>