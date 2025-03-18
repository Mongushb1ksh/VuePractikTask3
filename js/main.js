let eventBus = new Vue()

Vue.component('card-form', {

    template:`
        <form class="card" @submit.prevent="onSubmit">
            <h3>Новая задача</h3>
            <input v-model="card.title" placeholder="Заголовок" required>
            <textarea v-model="card.description" placeholder="Описание" required></textarea>
            <input type="date" v-model="card.deadline" required>
            <button type="submit">Создать</button>
        </form>
    `,

    data(){
        return{
            card:{
                title: '',
                description: '',
                deadline: '',
            }
        }
    },

    methods:{
        onSubmit(){
            this.$emit('add-card',{
                card:{
                    title: '',
                    description: '',
                    deadline: '',
                },
                id: Date.now(),
                createdAt: new Date().toLocaleString(),
                update: new Date().toLocaleString(),
            });
            this.card = { title: '', description: '', deadline: '' };
        }
    },
})


Vue.component('task-card', {
    props:['card'],
    template:`
        <div class="card">
            <h3>{{ card.title }}</h3>
            <p>{{ card.description }}</p>
            <div>Дедлайн: {{}}</div>
        </div>
    `
})




let app = new Vue({
    el: '#app',
    data: {
            columns: [
                { title: 'Запланированные задачи', cards: [] },
                { title: 'Задачи в работе', cards: [] },
                { title: 'Тестирование', cards: [] },
                { title: 'Выполненные задачи', cards: [] },

            ],
    },

    methods:{
        addCard(){
            this.column[0].card.push(newCard);
        },
    },

   
});