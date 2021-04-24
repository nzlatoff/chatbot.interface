# CHATBOT: Interface

The web server and interface for the project [CHATBOT](http://www.manufacture.ch/fr/4467/CHATBOT-jouer-et-dialoguer-avec-un-agent-conversationnel-acteur), led by [Nicolas Zlatoff](http://www.manufacture.ch/en/1695/Nicolas-Zlatoff) at the [Manufacture University of Performing Arts](http://www.manufacture.ch/en/) in Lausanne, Switzerland.

Many thanks to [Marc Riner](https://github.com/mriner) for laying down the foundations of this code base and for some good pieces of advice in network lore.

The app is written in [node](https://nodejs.org/en/), using [socket.io](https://socket.io/), originally based on [this](https://github.com/ezesundayeze/anonymouse-realtime-chat-app). It uses [MongoDB](https://www.mongodb.com/) as a back-end database for saving messages. For the bot part using [OpenAI’s GPT- 2](https://openai.com/blog/tags/gpt-2/), please see the GPT-2 client repository XXXX.

## Installation

Clone this repository and run

```bash
npm install
```
To run for development (using nodemon):

```bash
npm run devstart
```

To run normally:

```bash
npm start
```

Go to your browser at `http://localhost:5100/` to start chatting.

To run the app in the background and redirect [both the regular output and errors](https://www.brianstorti.com/understanding-shell-script-idiom-redirect/) to a file called `server.log` located in the directory just above the app repository, `cd` to the top of the repository and run the following command:
```bash
npm start 2>&1 > ../server.log &
```

## Pages

  - Login: the login page appears and records the name or nickname of the actor. In the pages dedicated to chatting, two fields of input are available, allowing actors to specify the character they wish to impersonate. the same system distinguishing actor name and character name is used by the bots as well.
  - Chat (`/`): the default view, that tracks the direct typing of the various participants (except oneself).
  - Dual (`/dual`): the screen is split between the direct typing of the various participants and the complete history of the current session. The session being stored as it occurs, opening the dual page will load past messages of the current session.
  - Audience (`/audience`): a copy of `/dual`, allowing for audience members to follow the progress without being logged in or counted as participants.
    - Actions:
      - Keyboard: **press the spacebar**, mobile: **tap with two fingers** to switch between the various views (chat history, direct typing, or both).
  - Bots (`/bots`): the page displays only the texts produced by artificial entities. The direct mode will display the entire message that a bot sends, while the gradual mode displays the same message one chunk at a time, at a speed that can be controlled on the master page. **For the purpose of the performance, a Text To Speech system (the unofficial Google Translate API) has been implemented on the direct bot mode: when open, the page will automatically read out loud any incoming bot message.**
    - Actions:
      - Keyboard: press **d**, mobile: **tap with two fingers**, to switch between direct and gradual modes. The direct mode includes an audio rendition using the Google translate API.
      - Keyboard: press **b**, mobile: **tap with three fingers**, to switch between the bots, the default option being to display them all in a split screen.
  - Master (`/master`): the control centre allowing a master user, and only one at a time, to control the bots connected to the server.
    - Header: the top of the page contains the inception date of the current session, or none if no human user is connected, as well as four links on the right hand side.
      - *session*, which allows the user to download the current session messages as a json file;
      archive,  which links to the archive page, where passed conversations can be
      - *mecha*: a link to the mechanism page.
      - *reset*: reset the current session. This will erase all messages in the history pane as well as the content of the mechanism page. It will also stop any ongoing generation from connected bots.
    - Bot Panes: each bot has a specific panel, which only appears when it is connected. Its header describes its name, the ID of the socket through which it connects itself, the name of the model and of the run used on the client machine (for more information on the difference between model and run, please see the GPT-2 client repository XXXXX). On the bottom right, two buttons allow the user to control its behaviour: *gen!* will require the bot to produce text, and *set* will send the current configuration to the bot.
      - *mode*: *reactive*, *autonomous*: in the interactive mode, the bot only replies to incoming messages from humans;  in the autonomous mode, the bot will generate new messages at regular intervals, that can be controlled by the parameters *silence* and *pause*.
      - *batch size*: the number of parallel responses that the bot will generate at each round. This can be changed live, but takes a certain amount of time. Look out for notifications on the `/mechanism` page to see when the bot is ready to speak again. When the batch size is larger than one, and if the parameter *wait* is greater than zero, the produced options are displayed at the bottom of the pane, for a number of seconds controlled by the *wait* parameter. If an answer is selected, with a single click, and the countdown finishes, then the bot will choose this sentence. Double-clicking on a sentence will make the bot choose the sentence and end the countdown. If no answer is selected, the bot will choose one of the sentences randomly, but favouring sentences with a lower perplexity, see the GPT-2 client repository XXXX for more details. The skip button can be used to choose none of the sentences. Clicking on the countdown will end the choosing process, either by sending the chosen sentence to the robot, or by handing over the choice to it. Clicking on the generation button will automatically skip the current batch of sentences and ask for a new one.
      - *temperature*: modifies the sampling process. A lower temperature will make the bot almost always choose the most obvious, certain next token, whereas a high temperature on the contrary will make the bat choose obvious and rare/unusual tokens with a much more equal probability. A lower temperature stabilises generation, while a higher one makes it more creative. This should be handled with care, as a temperature that is too low leads to a greater danger of repetitive loops, whereas one that is too high leads to chaos. Usual values range between 0.8 and 0.95. This can be fruitfully combined with the parameters *top k* and *top p*.
      - *silence*: a number between 0 and 1 allowing the user to add an additional barrier to the bot answering. Each time a robot is about to generate, a die is thrown, yielding a number between 0 and 1. If that number is higher than the *silence* parameter, the answer will be generated, otherwise the but will remain silent. Setting the *silent* parameter to 0.5 means that on average the bot will only answer half the time.
      - *top p*: a number between 0 and 1. [Nucleus sampling](https://arxiv.org/abs/1904.09751). Limits the total cumulative probability of the most probable tokens to sample from at each step. Contrary to the top k parameter, this means that in the case where the next step is fairly clear, the bot might choose between, say, only two tokens, because those are by a margin more probable than all the rest combined. Where the next step is more uncertain however the number of tokens to sample from might be very large (many tokens with a small probability). If other than zero, overrides the *top k* parameter.
      - *top k*: limits the number of tokens to sample from at each step to the *k* the most probable ones. In the original repository by OpenAI, that figure was 40.
      - *tempo*: controls the speed at which the text is gradually displayed on the `/bots` and the chats pages. The number describes the short pause between the sending of each new chunk, in seconds.
      - *wait*: controls how many seconds the bot will wait before choosing the generated sentence in the next batch. Equals the number in the countdown.
      - *pause*: controls how much time the bot will remain silent before being able to speak again or answer again after having generated.
      - *character*: the name of the character speaking. This can also include didascalia.
      - *first words*: force the robot to start its answer with these words (the bot will continue generating text on that basis). If no character is set, the first words will not appear but will act in the same way as the subtext.
      - *subtext*:  text that is added in the background at the end of the last received message. This means that it is possible to influence the tone or content of the bot generation, while never seeing that text ever appear in the actual chat.
    - Actions:
      - Keyboard: **ctrl+ENTER** clicks on *set*, sending the current parameters to the bot. This does not affect an ongoing choice process, however it will change the *wait* parameter, yielding to unexpected behaviour if the new *wait* parameter is smaller than the current one.
      - Keyboard: **alt+ENTER** clicks on *generate*, asking for more text from the bot, skipping the current batch if there is a choice in process.
  - Mechanism (`/mechanism`): as bots produce text and more information in the backend, a textual representation of this activity is sent to this page, which acts as a window into to the life of the writing machines. Only the activity occurring after the page has been opened will be recorded and displayed, and its content will be entirely erased upon session reset. If there is more than one bot active at the same time, the page will be split into columns, each dedicated to one entity.
  - Archive (`/archive`): a dashboard allowing the user to browse through past
    sessions, as well as accessing, through the button `all` in the header, the entirety of the database archives, gathered in one json file. In the main window, each line represents one session, described by its inception date as well as the number of messages. Clicking on any of them will reveal its contents, as well as three buttons in the lower right. `back` is used to restore the list of sessions, `json` will allow the user to save the selected session as a json file, and `info` will reveal the actor/bot name as well as the date and time of each message.
  - Archives (`/archives`): the direct link to the generated json file containing all messages from the beginning of the existence of the database.

## Database

The app creates a database called `chat` and will save the messages in a collection called `leschats`. In order to see the messages in the server terminal, type the following commands:

```bash
mongo
> use chat
> db.leschats.show().pretty()
```
