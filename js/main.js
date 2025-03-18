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
            card: {
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
                    title: this.card.title,
                    description: this.card.description,
                    deadline: this.card.deadline,
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
            <div>Дедлайн:{{ card.deadline }}</div>
            <button @click="$emit('move-card', 1)">Переместить</button>
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
        addCard(newCard){
            this.columns[0].cards.push(newCard);
        },
        moveCard(fromColumn, card){

        },

    },

   
});