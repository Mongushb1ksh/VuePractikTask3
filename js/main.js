let eventBus = new Vue()

Vue.component('card-form', {
    props: {
        initialCard: {
            type: Object,
            required: false,
        }
    },

    template:`
        <form class="card" @submit.prevent="onSubmit">
            <h3>{{ isEditing ? 'Редактировать' : 'Новая задача'}}</h3>
            <input v-model="card.title" placeholder="Заголовок" required>
            <textarea v-model="card.description" placeholder="Описание" required></textarea>
            <input type="date" v-model="card.deadline" required>
            <button type="submit">{{isEditing ? 'Сохранить' : 'Создать'}}</button>
            <button type="button" @click="$emit('close')">Отмена</button>
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
    computed: {
        isEditing(){
            return !!this.initialCard;
        }
    },

    methods:{
        resetForm(){
            this.card = { title: '', description: '', deadline: '' }; 
        },

        onSubmit(){
            const newCard = { 
                id: this.initialCard ? this.initialCard.id : Date.now(),              
                title: this.card.title,
                description: this.card.description,
                deadline: this.card.deadline,
                createdAt: this.initialCard ? this.initialCard.createdAt : new Date().toLocaleString(),
                editAt:  this.initialCard ? new Date().toLocaleString() : '',
                updateAt: new Date().toLocaleString(),
            };
            this.$emit(this.initialCard ? 'save-card' : 'add-card', newCard);
            this.resetForm();
            this.$emit('close')
        }
    },
    created(){
        if(this.initialCard){
            this.card = {...this.initialCard}
        }
    },
})


Vue.component('task-card', {
    props: {
        card: {
            type: Object,
            required: true,
        },
        columnIndex: {
            type: Number,
            required: true,
        },
    },
    template:`
        <div class="card">
            <h3>{{ card.title }}</h3>
            <p>{{ card.description }}</p>
            <div>Создано: {{ card.createdAt }}</div>
            <div>Дедлайн:{{ formatDate(card.deadline) }}</div>
            <div v-if="card.completedAt">Завершено: {{ card.completedAt }}</div>
            <button v-if="columnIndex === 2" @click="$emit('card-move')">На исправления</button>
            <button v-if="columnIndex < 3" @click="$emit('move-card')">Переместить</button>
            <button v-if="columnIndex < 3" @click="$emit('edit-card')">Редактировать</button>
            <button v-if="columnIndex === 0" @click="$emit('delete-card')">Удалить</button>
        </div>
    `,
    methods: {
        formatDate(date){
            return new Date(date).toLocaleDateString();
        },
    },
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
            editingCard: null,
            editingCardColumn: null,
            showModal: false,

    },

    methods:{

        openModal(){
            this.editingCard = null;
            this.showModal = true;
            this.$nextTick(() => {
                this.$refs.cardForm.resetForm();
            });
        },

        closeModal(){
            this.showModal = false;
            this.editingCard = null;
            this.editingCardColumn = null;
        },
        addCard(newCard){
            this.columns[0].cards.push(newCard);
            this.closeModal();
            this.saveData();
        },
        cardMove(fromColumn, card){
            if(fromColumn === 2){
                const toColumn = fromColumn - 1;
                this.columns[fromColumn].cards = this.columns[fromColumn].cards.filter(a => a.id !== card.id);
                this.columns[toColumn].cards.push(card);
                this.saveData();
            }
        },

        moveCard(fromColumn, card){
            if(fromColumn >= 3) return;
            const toColumn = fromColumn + 1;
            this.columns[fromColumn].cards = this.columns[fromColumn].cards.filter(a => a.id !== card.id);
            this.columns[toColumn].cards.push(card);
            if(toColumn === 3){
                card.completedAt = new Date().toLocaleString();
            };

            this.saveData();
        },
        deleteCard(card){
            this.columns.forEach(column => {
                const index = column.cards.findIndex(c => c.id === card.id)
                if(index !== -1){
                    column.cards.splice(index, 1);
                    this.saveData();
                }
            })
            
        },

        editCard(card, columnIndex){
            this.editingCard =  { ...card };
            this.editingCardColumn = columnIndex;
            this.showModal= true;
            this.$nextTick(() => {
                this.$refs.cardForm.resetForm();
            });
        },

        saveCard(updatedCard){
            const column = this.columns[this.editingCardColumn];
            const index = column.cards.findIndex(c => c.id === updatedCard.id);
            if(index !== -1){
              
                this.$set(column.cards, index,  {
                    ...column.cards[index],
                    ...updatedCard, 
                    updateAt: new Date().toLocaleString() 
                }    );
                this.closeModal();
                this.saveData();
            }
        },

        saveData(){
            const dataToSave = this.columns.map(column => ({
                title: column.title,
                cards: Array.isArray(column.cards) ? column.cards : []
            }));
            localStorage.setItem('notesApp', JSON.stringify(dataToSave));
        },
        loadData(){
            const savedData = localStorage.getItem('notesApp');
            if(savedData){
                const parsedData = JSON.parse(savedData);
                this.columns.forEach((column, index) => {
                    const savedColumn = parsedData.find(c => c.title === column.title);
                    if(savedColumn && Array.isArray(savedColumn.cards)){
                        this.$set(column, 'cards', savedColumn.cards);
                    }else{
                        this.$set(column, 'cards', []);
                    }
                });
            };
            this.saveData();
        },

    },

    created() {
        this.loadData();
    },

});