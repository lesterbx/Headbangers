<template>
    <concert-edit></concert-edit>
</template>
<script>
import { ConcertEdit } from '~/components/publish'
export default {
    middleware: 'auth',
    components: { ConcertEdit }
}
</script>
